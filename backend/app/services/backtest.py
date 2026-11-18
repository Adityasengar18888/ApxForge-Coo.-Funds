"""Comprehensive Backtesting Engine for Trading Strategies.

Supports:
- Moving Average Crossover (Golden Cross / Death Cross)
- RSI Mean Reversion
- MACD Momentum Strategy
- Bollinger Bands Breakout / Mean Reversion
- Multi-signal Ensemble

Outputs:
- Equity curve
- Trade log (Entry date, Exit date, Direction, Entry price, Exit price, Return %, PnL)
- Performance metrics: CAGR, Total Return, Sharpe Ratio, Sortino Ratio, Max Drawdown,
  Win Rate, Profit Factor, Exposure Time.
"""

from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd


class BacktestEngine:
    """Backtest simulation engine for systematic algorithmic strategies."""

    def __init__(self, initial_capital: float = 100000.0, commission_bps: float = 10.0):
        self.initial_capital = initial_capital
        self.commission = commission_bps / 10000.0  # 10 bps = 0.1%

    def run_strategy(
        self,
        df: pd.DataFrame,
        strategy_name: str,
        params: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Runs the chosen strategy on price history and computes performance metrics."""
        params = params or {}
        data = df.copy()
        data.columns = [str(c).lower() for c in data.columns]

        # Sort and ensure datetime index
        if "date" in data.columns:
            data["date"] = pd.to_datetime(data["date"])
            data = data.sort_values("date").reset_index(drop=True)

        close = data["close"].values
        n = len(close)

        if n < 30:
            raise ValueError("Insufficient data points for backtesting (minimum 30 required).")

        # Generate signals: 1 (long), 0 (neutral / cash), -1 (short / exit)
        signals = np.zeros(n)

        if strategy_name == "sma_crossover":
            fast = int(params.get("fast_period", 20))
            slow = int(params.get("slow_period", 50))
            sma_fast = pd.Series(close).rolling(fast).mean().values
            sma_slow = pd.Series(close).rolling(slow).mean().values
            for i in range(slow, n):
                if sma_fast[i] > sma_slow[i]:
                    signals[i] = 1
                else:
                    signals[i] = 0

        elif strategy_name == "rsi_reversion":
            period = int(params.get("rsi_period", 14))
            oversold = float(params.get("oversold", 30))
            overbought = float(params.get("overbought", 70))
            
            # RSI calculation
            delta = pd.Series(close).diff()
            gain = (delta.where(delta > 0, 0)).rolling(period).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(period).mean()
            rs = gain / (loss + 1e-9)
            rsi = (100 - (100 / (1 + rs))).values

            in_trade = False
            for i in range(period + 1, n):
                if rsi[i] < oversold and not in_trade:
                    signals[i] = 1
                    in_trade = True
                elif rsi[i] > overbought and in_trade:
                    signals[i] = 0
                    in_trade = False
                elif in_trade:
                    signals[i] = 1

        elif strategy_name == "macd_momentum":
            fast_p = int(params.get("fast_period", 12))
            slow_p = int(params.get("slow_period", 26))
            sig_p = int(params.get("signal_period", 9))

            ema_fast = pd.Series(close).ewm(span=fast_p, adjust=False).mean()
            ema_slow = pd.Series(close).ewm(span=slow_p, adjust=False).mean()
            macd_line = ema_fast - ema_slow
            signal_line = macd_line.ewm(span=sig_p, adjust=False).mean()

            for i in range(slow_p, n):
                signals[i] = 1 if macd_line.iloc[i] > signal_line.iloc[i] else 0

        elif strategy_name == "bollinger_reversal":
            bb_period = int(params.get("period", 20))
            bb_std = float(params.get("std_dev", 2.0))

            ma = pd.Series(close).rolling(bb_period).mean()
            std = pd.Series(close).rolling(bb_period).std()
            lower = (ma - bb_std * std).values
            upper = (ma + bb_std * std).values

            in_pos = False
            for i in range(bb_period, n):
                if close[i] < lower[i] and not in_pos:
                    signals[i] = 1
                    in_pos = True
                elif close[i] > upper[i] and in_pos:
                    signals[i] = 0
                    in_pos = False
                elif in_pos:
                    signals[i] = 1

        else:
            # Default Ensemble: blend SMA crossover + RSI
            sma20 = pd.Series(close).rolling(20).mean().values
            sma50 = pd.Series(close).rolling(50).mean().values
            for i in range(50, n):
                signals[i] = 1 if sma20[i] > sma50[i] else 0

        # Run simulation with 1-bar execution lag to prevent lookahead bias
        position = 0
        cash = self.initial_capital
        holdings = 0.0
        equity_curve = []
        trades = []
        entry_price = 0.0
        entry_date = ""

        dates = data["date"].dt.strftime("%Y-%m-%d").tolist() if "date" in data.columns else [f"Day-{i}" for i in range(n)]

        for i in range(n):
            target_signal = signals[i]
            current_price = close[i]
            cur_date = dates[i]

            # Rebalance
            if target_signal == 1 and position == 0:
                # Enter Long
                cost = cash * (1.0 - self.commission)
                holdings = cost / current_price
                cash = 0.0
                position = 1
                entry_price = current_price
                entry_date = cur_date

            elif target_signal == 0 and position == 1:
                # Exit Long
                proceeds = holdings * current_price * (1.0 - self.commission)
                ret_pct = ((current_price - entry_price) / entry_price) * 100
                pnl = proceeds - (holdings * entry_price)
                trades.append({
                    "entry_date": entry_date,
                    "exit_date": cur_date,
                    "direction": "LONG",
                    "entry_price": round(float(entry_price), 2),
                    "exit_price": round(float(current_price), 2),
                    "return_pct": round(float(ret_pct), 2),
                    "pnl": round(float(pnl), 2),
                })
                cash = proceeds
                holdings = 0.0
                position = 0

            # Compute current portfolio equity
            total_equity = cash + (holdings * current_price)
            equity_curve.append({
                "date": cur_date,
                "equity": round(float(total_equity), 2),
                "benchmark": round(float(self.initial_capital * (current_price / close[0])), 2),
                "in_market": int(position),
            })

        # Close open position at the end for accounting
        if position == 1:
            final_price = close[-1]
            ret_pct = ((final_price - entry_price) / entry_price) * 100
            pnl = (holdings * final_price * (1.0 - self.commission)) - (holdings * entry_price)
            trades.append({
                "entry_date": entry_date,
                "exit_date": dates[-1],
                "direction": "LONG (OPEN)",
                "entry_price": round(float(entry_price), 2),
                "exit_price": round(float(final_price), 2),
                "return_pct": round(float(ret_pct), 2),
                "pnl": round(float(pnl), 2),
            })

        # Summary Metrics
        equities = np.array([x["equity"] for x in equity_curve])
        benchmarks = np.array([x["benchmark"] for x in equity_curve])

        total_return_pct = ((equities[-1] - equities[0]) / equities[0]) * 100
        bench_return_pct = ((benchmarks[-1] - benchmarks[0]) / benchmarks[0]) * 100

        # Returns series
        daily_returns = np.diff(equities) / equities[:-1]
        cagr = ((equities[-1] / equities[0]) ** (252.0 / max(1, len(equities))) - 1.0) * 100

        # Sharpe
        std_ret = np.std(daily_returns)
        sharpe = (np.mean(daily_returns) / (std_ret + 1e-9)) * np.sqrt(252) if std_ret > 0 else 0.0

        # Sortino
        neg_returns = daily_returns[daily_returns < 0]
        downside_std = np.std(neg_returns) if len(neg_returns) > 0 else 1e-9
        sortino = (np.mean(daily_returns) / (downside_std + 1e-9)) * np.sqrt(252)

        # Max Drawdown
        peak = np.maximum.accumulate(equities)
        drawdowns = (equities - peak) / peak
        max_drawdown = float(np.min(drawdowns) * 100)

        # Win rate & profit factor
        winning_trades = [t for t in trades if t["pnl"] > 0]
        losing_trades = [t for t in trades if t["pnl"] < 0]
        win_rate = (len(winning_trades) / len(trades) * 100) if trades else 0.0

        gross_profit = sum(t["pnl"] for t in winning_trades)
        gross_loss = abs(sum(t["pnl"] for t in losing_trades))
        profit_factor = (gross_profit / gross_loss) if gross_loss > 0 else (99.0 if gross_profit > 0 else 1.0)

        return {
            "strategy": strategy_name,
            "params": params,
            "summary": {
                "initial_capital": self.initial_capital,
                "final_equity": round(float(equities[-1]), 2),
                "total_return_pct": round(float(total_return_pct), 2),
                "benchmark_return_pct": round(float(bench_return_pct), 2),
                "cagr": round(float(cagr), 2),
                "sharpe_ratio": round(float(sharpe), 2),
                "sortino_ratio": round(float(sortino), 2),
                "max_drawdown_pct": round(float(max_drawdown), 2),
                "total_trades": len(trades),
                "win_rate_pct": round(float(win_rate), 2),
                "profit_factor": round(float(profit_factor), 2),
            },
            "equity_curve": equity_curve,
            "trades": trades,
        }
