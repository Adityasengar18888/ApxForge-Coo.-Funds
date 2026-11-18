import os
import time
import pandas as pd
import numpy as np
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any, Tuple
from pathlib import Path
from backend.app.core.config import settings
from backend.app.core.logging import logger

# In-memory cache: { cache_key: (timestamp, data) }
_cache: Dict[str, Tuple[float, Any]] = {}

def get_from_cache(key: str, ttl_seconds: float) -> Optional[Any]:
    if key in _cache:
        ts, data = _cache[key]
        if time.time() - ts < ttl_seconds:
            return data
    return None

def set_in_cache(key: str, data: Any):
    _cache[key] = (time.time(), data)

class BaseDataProvider(ABC):
    @abstractmethod
    def get_quote(self, symbol: str) -> Dict[str, Any]:
        pass

    @abstractmethod
    def get_history(self, symbol: str, period: str = "1y") -> pd.DataFrame:
        pass

    @abstractmethod
    def get_fundamentals(self, symbol: str) -> Dict[str, Any]:
        pass

    @abstractmethod
    def get_option_chain(self, symbol: str) -> pd.DataFrame:
        pass

    @abstractmethod
    def get_news(self, symbol: str) -> List[Dict[str, Any]]:
        pass


class MockDataProvider(BaseDataProvider):
    """Deterministic mock provider using offline CSVs or synthetic generation."""

    def __init__(self):
        self.raw_data_dir = Path("data/raw")
        self.processed_data_dir = Path("data/processed")

    def get_quote(self, symbol: str) -> Dict[str, Any]:
        symbol = symbol.upper()
        history = self.get_history(symbol, period="1mo")
        latest = history.iloc[-1]
        prev = history.iloc[-2] if len(history) > 1 else latest
        change = latest["Close"] - prev["Close"]
        change_pct = (change / prev["Close"]) * 100.0

        return {
            "symbol": symbol,
            "price": round(float(latest["Close"]), 2),
            "change": round(float(change), 2),
            "change_pct": round(float(change_pct), 2),
            "open": round(float(latest["Open"]), 2),
            "high": round(float(latest["High"]), 2),
            "low": round(float(latest["Low"]), 2),
            "volume": int(latest["Volume"]),
            "timestamp": pd.Timestamp.now().isoformat()
        }

    def get_history(self, symbol: str, period: str = "1y") -> pd.DataFrame:
        symbol = symbol.upper()
        file_path = self.raw_data_dir / f"{symbol.lower()}_price.csv"
        legacy_path = Path("legacy_reference/data/raw") / f"{symbol.lower()}_price.csv"

        target_file = file_path if file_path.exists() else (legacy_path if legacy_path.exists() else None)

        if target_file:
            df = pd.read_csv(target_file, index_col=0, parse_dates=True)
            df["returns"] = np.log(df["Close"] / df["Close"].shift(1))
            return df.dropna()

        # Fallback synthetic series
        dates = pd.date_range(end=pd.Timestamp.now(), periods=252, freq="B")
        np.random.seed(hash(symbol) % 2**32)
        returns = np.random.normal(0.0005, 0.015, len(dates))
        price = 150.0 * np.exp(np.cumsum(returns))
        df = pd.DataFrame({
            "Open": price * (1 + np.random.normal(0, 0.005, len(dates))),
            "High": price * (1 + abs(np.random.normal(0, 0.01, len(dates)))),
            "Low": price * (1 - abs(np.random.normal(0, 0.01, len(dates)))),
            "Close": price,
            "Volume": np.random.randint(1000000, 50000000, len(dates)),
            "returns": returns
        }, index=dates)
        return df

    def get_fundamentals(self, symbol: str) -> Dict[str, Any]:
        return {
            "symbol": symbol.upper(),
            "pe_ratio": 28.5,
            "forward_pe": 24.2,
            "peg_ratio": 1.45,
            "price_to_book": 8.2,
            "dividend_yield": 0.0065,
            "market_cap": 2850000000000,
            "beta": 1.15,
            "fifty_two_week_high": 240.0,
            "fifty_two_week_low": 165.0,
            "sector": "Technology",
            "industry": "Consumer Electronics"
        }

    def get_option_chain(self, symbol: str) -> pd.DataFrame:
        symbol = symbol.upper()
        file_path = self.processed_data_dir / f"{symbol.lower()}_options_dataset.csv"
        legacy_path = Path("legacy_reference/data/processed") / f"{symbol.lower()}_options_dataset.csv"

        target_file = file_path if file_path.exists() else (legacy_path if legacy_path.exists() else None)

        if target_file:
            df = pd.read_csv(target_file)
            # Adapt columns to expected schema if synthetic
            if "lastPrice" not in df.columns and "MarketPrice" in df.columns:
                df["lastPrice"] = df["MarketPrice"]
            if "strike" not in df.columns and "Strike" in df.columns:
                df["strike"] = df["Strike"]
            if "impliedVolatility" not in df.columns and "Vol" in df.columns:
                df["impliedVolatility"] = df["Vol"]
            if "volume" not in df.columns:
                df["volume"] = 1500
            if "expiry" not in df.columns:
                df["expiry"] = "2026-12-18"
            df["ticker"] = symbol
            return df

        # Generate standard chain
        quote = self.get_quote(symbol)
        spot = quote["price"]
        strikes = [round(spot * factor, 1) for factor in [0.85, 0.9, 0.95, 1.0, 1.05, 1.1, 1.15]]
        rows = []
        for strike in strikes:
            rows.append({
                "ticker": symbol,
                "strike": strike,
                "lastPrice": max(0.5, round(abs(spot - strike) + 5.0, 2)),
                "impliedVolatility": 0.25,
                "volume": 2500,
                "openInterest": 12000,
                "expiry": "2026-12-18",
                "option_type": "call"
            })
            rows.append({
                "ticker": symbol,
                "strike": strike,
                "lastPrice": max(0.5, round(abs(strike - spot) + 4.5, 2)),
                "impliedVolatility": 0.26,
                "volume": 1800,
                "openInterest": 8500,
                "expiry": "2026-12-18",
                "option_type": "put"
            })
        return pd.DataFrame(rows)

    def get_news(self, symbol: str) -> List[Dict[str, Any]]:
        symbol = symbol.upper()
        return [
            {
                "title": f"{symbol} Reports Strong Quarterly Performance and Upgrades Guidance",
                "publisher": "Financial Times",
                "link": f"https://finance.yahoo.com/quote/{symbol}",
                "published_at": pd.Timestamp.now().strftime("%Y-%m-%d %H:%M"),
                "sentiment": "positive",
                "sentiment_score": 0.75,
                "summary": f"Analysts highlight growing operational margins and strategic positioning for {symbol}."
            },
            {
                "title": f"Institutional Options Volume Surges in {symbol} Ahead of Key Macro Data",
                "publisher": "Bloomberg Markets",
                "link": f"https://finance.yahoo.com/quote/{symbol}",
                "published_at": (pd.Timestamp.now() - pd.Timedelta(hours=4)).strftime("%Y-%m-%d %H:%M"),
                "sentiment": "neutral",
                "sentiment_score": 0.12,
                "summary": f"Notable call and put activity observed in {symbol} near front-month contracts."
            }
        ]


class YFinanceDataProvider(BaseDataProvider):
    """Live provider via yfinance with error handling and fallback."""

    def __init__(self):
        self.mock = MockDataProvider()

    def get_quote(self, symbol: str) -> Dict[str, Any]:
        cache_key = f"quote_{symbol}"
        cached = get_from_cache(cache_key, ttl_seconds=60)
        if cached:
            return cached

        try:
            import yfinance as yf
            stock = yf.Ticker(symbol)
            fast = stock.fast_info
            price = fast.last_price if hasattr(fast, "last_price") and fast.last_price else None
            if not price:
                hist = stock.history(period="5d")
                if not hist.empty:
                    price = float(hist["Close"].iloc[-1])
            if not price:
                return self.mock.get_quote(symbol)

            prev_close = fast.previous_close if hasattr(fast, "previous_close") and fast.previous_close else price
            change = price - prev_close
            change_pct = (change / prev_close) * 100.0 if prev_close else 0.0

            res = {
                "symbol": symbol.upper(),
                "price": round(float(price), 2),
                "change": round(float(change), 2),
                "change_pct": round(float(change_pct), 2),
                "open": round(float(getattr(fast, "open", price)), 2),
                "high": round(float(getattr(fast, "day_high", price)), 2),
                "low": round(float(getattr(fast, "day_low", price)), 2),
                "volume": int(getattr(fast, "last_volume", 1000000)),
                "timestamp": pd.Timestamp.now().isoformat()
            }
            set_in_cache(cache_key, res)
            return res
        except Exception as e:
            logger.warning(f"yfinance get_quote error for {symbol}: {e}. Falling back to mock data.")
            return self.mock.get_quote(symbol)

    def get_history(self, symbol: str, period: str = "1y") -> pd.DataFrame:
        cache_key = f"hist_{symbol}_{period}"
        cached = get_from_cache(cache_key, ttl_seconds=3600)
        if cached is not None:
            return cached

        try:
            import yfinance as yf
            stock = yf.Ticker(symbol)
            df = stock.history(period=period)
            if df.empty or len(df) < 5:
                return self.mock.get_history(symbol, period)

            df["returns"] = np.log(df["Close"] / df["Close"].shift(1))
            res = df.dropna()
            set_in_cache(cache_key, res)
            return res
        except Exception as e:
            logger.warning(f"yfinance get_history error for {symbol}: {e}. Falling back to mock data.")
            return self.mock.get_history(symbol, period)

    def get_fundamentals(self, symbol: str) -> Dict[str, Any]:
        cache_key = f"fund_{symbol}"
        cached = get_from_cache(cache_key, ttl_seconds=86400)
        if cached:
            return cached

        try:
            import yfinance as yf
            stock = yf.Ticker(symbol)
            info = stock.info
            res = {
                "symbol": symbol.upper(),
                "pe_ratio": info.get("trailingPE", 25.0),
                "forward_pe": info.get("forwardPE", 22.0),
                "peg_ratio": info.get("pegRatio", 1.5),
                "price_to_book": info.get("priceToBook", 7.5),
                "dividend_yield": info.get("dividendYield", 0.005),
                "market_cap": info.get("marketCap", 1000000000000),
                "beta": info.get("beta", 1.1),
                "fifty_two_week_high": info.get("fiftyTwoWeekHigh", 200.0),
                "fifty_two_week_low": info.get("fiftyTwoWeekLow", 150.0),
                "sector": info.get("sector", "Technology"),
                "industry": info.get("industry", "Consumer Electronics")
            }
            set_in_cache(cache_key, res)
            return res
        except Exception as e:
            logger.warning(f"yfinance get_fundamentals error for {symbol}: {e}. Falling back to mock data.")
            return self.mock.get_fundamentals(symbol)

    def get_option_chain(self, symbol: str) -> pd.DataFrame:
        cache_key = f"chain_{symbol}"
        cached = get_from_cache(cache_key, ttl_seconds=900)
        if cached is not None:
            return cached

        try:
            import yfinance as yf
            stock = yf.Ticker(symbol)
            expiries = stock.options
            if not expiries:
                return self.mock.get_option_chain(symbol)

            all_options = []
            for expiry in expiries[:3]:  # Top 3 expiries to prevent rate-limiting
                chain = stock.option_chain(expiry)
                for opt_type, df in zip(["call", "put"], [chain.calls, chain.puts]):
                    df = df.copy()
                    df["option_type"] = opt_type
                    df["expiry"] = expiry
                    df["ticker"] = symbol.upper()
                    all_options.append(df)

            if not all_options:
                return self.mock.get_option_chain(symbol)

            res = pd.concat(all_options, ignore_index=True)
            set_in_cache(cache_key, res)
            return res
        except Exception as e:
            logger.warning(f"yfinance get_option_chain error for {symbol}: {e}. Falling back to mock data.")
            return self.mock.get_option_chain(symbol)

    def get_news(self, symbol: str) -> List[Dict[str, Any]]:
        try:
            import yfinance as yf
            stock = yf.Ticker(symbol)
            news_items = stock.news
            if not news_items:
                return self.mock.get_news(symbol)

            formatted = []
            for item in news_items[:10]:
                title = item.get("title", "")
                # Simple sentiment calculation (VADER-style rule)
                lower_title = title.lower()
                pos_words = ["surge", "jump", "record", "profit", "gain", "upgrade", "growth", "strong", "bull"]
                neg_words = ["drop", "fall", "slump", "loss", "downgrade", "probe", "plunge", "bear", "risk"]
                score = 0.0
                if any(w in lower_title for w in pos_words):
                    score += 0.5
                if any(w in lower_title for w in neg_words):
                    score -= 0.5

                sentiment = "positive" if score > 0.2 else ("negative" if score < -0.2 else "neutral")

                formatted.append({
                    "title": title,
                    "publisher": item.get("publisher", "Market News"),
                    "link": item.get("link", f"https://finance.yahoo.com/quote/{symbol}"),
                    "published_at": pd.to_datetime(item.get("providerPublishTime", time.time()), unit="s").strftime("%Y-%m-%d %H:%M"),
                    "sentiment": sentiment,
                    "sentiment_score": round(score, 2),
                    "summary": item.get("title", "")
                })
            return formatted
        except Exception as e:
            logger.warning(f"yfinance get_news error for {symbol}: {e}. Falling back to mock data.")
            return self.mock.get_news(symbol)


def get_data_provider() -> BaseDataProvider:
    if settings.USE_MOCK_DATA:
        return MockDataProvider()
    return YFinanceDataProvider()

data_provider = get_data_provider()
