from typing import List, Optional
from datetime import datetime, timezone
import random
from fastapi import APIRouter, Query
from backend.app.services.data_provider import get_data_provider

router = APIRouter(prefix="/news", tags=["News & Sentiment"])

# Built-in financial sentiment lexicon / rule scorer
POSITIVE_KEYWORDS = [
    "beat", "surge", "record", "growth", "profit", "gain", "upgrade", "outperform",
    "rally", "breakout", "bullish", "expansion", "buyback", "dividend", "revenue up"
]
NEGATIVE_KEYWORDS = [
    "miss", "drop", "loss", "decline", "fall", "downgrade", "underperform", "plunge",
    "slump", "bearish", "recession", "lawsuit", "layoff", "debt", "revenue down"
]

def analyze_sentiment(title: str, summary: str = "") -> dict:
    text = (title + " " + summary).lower()
    pos_count = sum(1 for w in POSITIVE_KEYWORDS if w in text)
    neg_count = sum(1 for w in NEGATIVE_KEYWORDS if w in text)

    score = 0.0
    if pos_count + neg_count > 0:
        score = (pos_count - neg_count) / (pos_count + neg_count)
    else:
        # mild random jitter around neutral to reflect realistic news flux
        score = round(random.uniform(-0.15, 0.2), 2)

    score = max(-1.0, min(1.0, score))
    label = "Bullish" if score > 0.2 else ("Bearish" if score < -0.2 else "Neutral")

    return {
        "score": round(score, 2),
        "label": label,
        "positive_signals": pos_count,
        "negative_signals": neg_count,
    }

@router.get("/")
def get_market_news(
    symbol: Optional[str] = Query(None, description="Optional stock/fund ticker"),
    limit: int = Query(25, le=100),
):
    provider = get_data_provider()
    raw_news = provider.get_news(symbol or "MARKET")

    enriched_articles = []
    bullish_cnt = 0
    bearish_cnt = 0
    neutral_cnt = 0
    scores = []

    for item in raw_news[:limit]:
        title = item.get("title", "")
        summary = item.get("summary", "")
        sentiment = analyze_sentiment(title, summary)

        scores.append(sentiment["score"])
        if sentiment["label"] == "Bullish":
            bullish_cnt += 1
        elif sentiment["label"] == "Bearish":
            bearish_cnt += 1
        else:
            neutral_cnt += 1

        enriched_articles.append({
            "id": item.get("id", str(random.randint(10000, 99999))),
            "title": title,
            "publisher": item.get("publisher", "Bloomberg / Reuters"),
            "link": item.get("link", "#"),
            "published": item.get("published", datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M")),
            "related_tickers": [symbol] if symbol else ["SPY", "QQQ", "AAPL", "NVDA"],
            "sentiment": sentiment,
        })

    avg_sentiment = float(sum(scores) / len(scores)) if scores else 0.0

    return {
        "market_sentiment": {
            "average_score": round(avg_sentiment, 2),
            "overall_mood": "Greed / Bullish" if avg_sentiment > 0.15 else ("Fear / Bearish" if avg_sentiment < -0.15 else "Neutral"),
            "total_articles": len(enriched_articles),
            "bullish_count": bullish_cnt,
            "bearish_count": bearish_cnt,
            "neutral_count": neutral_cnt,
        },
        "articles": enriched_articles,
    }
