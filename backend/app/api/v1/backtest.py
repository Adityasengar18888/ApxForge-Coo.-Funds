from typing import Any, Dict, List, Optional
import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlmodel import Session, select

from backend.app.core.deps import get_db, get_current_user_optional, get_current_user
from backend.app.models.user import User
from backend.app.models.backtest import Backtest
from backend.app.services.data_provider import get_data_provider
from backend.app.services.backtest import BacktestEngine

router = APIRouter(prefix="/backtest", tags=["Backtesting"])

class BacktestRequest(BaseModel):
    symbol: str = "AAPL"
    strategy_name: str = "sma_crossover"  # sma_crossover, rsi_reversion, macd_momentum, bollinger_reversal
    period: str = "2y"
    initial_capital: float = 100000.0
    commission_bps: float = 10.0
    params: Optional[Dict[str, Any]] = None

@router.post("/run")
def run_backtest(
    req: BacktestRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    provider = get_data_provider()
    df = provider.get_history(req.symbol, period=req.period)
    if df.empty:
        raise HTTPException(status_code=400, detail=f"No price data available for {req.symbol}")

    engine = BacktestEngine(
        initial_capital=req.initial_capital,
        commission_bps=req.commission_bps
    )
    result = engine.run_strategy(df, req.strategy_name, req.params)

    # Save to database if user logged in
    user_id = current_user.id if current_user else 1
    summary = result["summary"]
    trades = result["trades"]
    equity = result["equity_curve"]

    dates = [x["date"] for x in equity]
    start_date = dates[0] if dates else ""
    end_date = dates[-1] if dates else ""

    bt_record = Backtest(
        user_id=user_id,
        strategy_name=req.strategy_name,
        symbol=req.symbol.upper(),
        start_date=start_date,
        end_date=end_date,
        initial_capital=req.initial_capital,
        final_value=summary["final_equity"],
        cagr=summary["cagr"],
        sharpe_ratio=summary["sharpe_ratio"],
        sortino_ratio=summary["sortino_ratio"],
        max_drawdown=summary["max_drawdown_pct"],
        win_rate=summary["win_rate_pct"],
        total_trades=summary["total_trades"],
        trades_json=json.dumps(trades[:100]),
        equity_curve_json=json.dumps(equity[-250:]),
    )
    try:
        db.add(bt_record)
        db.commit()
        db.refresh(bt_record)
        result["id"] = bt_record.id
    except Exception:
        db.rollback()

    return result

@router.get("/history")
def list_backtests(
    symbol: Optional[str] = None,
    limit: int = Query(20, le=100),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    user_id = current_user.id if current_user else 1
    query = select(Backtest).where(Backtest.user_id == user_id)
    if symbol:
        query = query.where(Backtest.symbol == symbol.upper())
    query = query.order_by(Backtest.created_at.desc()).limit(limit)
    rows = db.exec(query).all()
    return {
        "backtests": [
            {
                "id": r.id,
                "strategy_name": r.strategy_name,
                "symbol": r.symbol,
                "start_date": r.start_date,
                "end_date": r.end_date,
                "initial_capital": r.initial_capital,
                "final_value": r.final_value,
                "cagr": r.cagr,
                "sharpe_ratio": r.sharpe_ratio,
                "sortino_ratio": r.sortino_ratio,
                "max_drawdown": r.max_drawdown,
                "win_rate": r.win_rate,
                "total_trades": r.total_trades,
                "created_at": r.created_at.isoformat(),
            }
            for r in rows
        ]
    }

@router.get("/{backtest_id}")
def get_backtest_detail(
    backtest_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    bt = db.get(Backtest, backtest_id)
    if not bt:
        raise HTTPException(status_code=404, detail="Backtest not found")
    return {
        "id": bt.id,
        "strategy_name": bt.strategy_name,
        "symbol": bt.symbol,
        "start_date": bt.start_date,
        "end_date": bt.end_date,
        "initial_capital": bt.initial_capital,
        "final_value": bt.final_value,
        "cagr": bt.cagr,
        "sharpe_ratio": bt.sharpe_ratio,
        "sortino_ratio": bt.sortino_ratio,
        "max_drawdown": bt.max_drawdown,
        "win_rate": bt.win_rate,
        "total_trades": bt.total_trades,
        "trades": json.loads(bt.trades_json),
        "equity_curve": json.loads(bt.equity_curve_json),
        "created_at": bt.created_at.isoformat(),
    }

@router.delete("/{backtest_id}")
def delete_backtest(
    backtest_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    bt = db.get(Backtest, backtest_id)
    if not bt:
        raise HTTPException(status_code=404, detail="Backtest not found")
    if bt.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    db.delete(bt)
    db.commit()
    return {"status": "deleted", "id": backtest_id}
