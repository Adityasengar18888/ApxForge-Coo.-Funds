from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from backend.app.core.deps import get_db, get_current_user_optional, get_current_user
from backend.app.models.user import User
from backend.app.models.alert import Alert
from backend.app.services.data_provider import get_data_provider

router = APIRouter(prefix="/alerts", tags=["Alerts"])

class AlertCreate(BaseModel):
    symbol: str
    alert_type: str = "price_above"  # price_above, price_below, rsi_overbought, rsi_oversold, volatility_spike
    condition: str = ">"
    threshold: float

@router.get("/")
def get_alerts(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    user_id = current_user.id if current_user else 1
    alerts_db = db.exec(select(Alert).where(Alert.user_id == user_id)).all()

    # If empty for default user, seed 2 sample alerts
    if not alerts_db and (not current_user or current_user.username == "admin"):
        samples = [
            Alert(user_id=user_id, symbol="AAPL", alert_type="price_above", condition=">", threshold=250.0),
            Alert(user_id=user_id, symbol="NVDA", alert_type="rsi_overbought", condition=">=", threshold=75.0),
            Alert(user_id=user_id, symbol="SPY", alert_type="price_below", condition="<", threshold=500.0),
        ]
        for a in samples:
            db.add(a)
        db.commit()
        alerts_db = db.exec(select(Alert).where(Alert.user_id == user_id)).all()

    provider = get_data_provider()
    results = []

    for alert in alerts_db:
        quote = provider.get_quote(alert.symbol)
        curr_price = float(quote.get("price", 0.0))

        # Check trigger condition
        triggered = alert.is_triggered
        if not triggered:
            if alert.alert_type == "price_above" and curr_price >= alert.threshold:
                triggered = True
            elif alert.alert_type == "price_below" and curr_price <= alert.threshold:
                triggered = True

        if triggered and not alert.is_triggered:
            alert.is_triggered = True
            alert.triggered_at = datetime.now(timezone.utc)
            db.add(alert)
            db.commit()

        results.append({
            "id": alert.id,
            "symbol": alert.symbol,
            "alert_type": alert.alert_type,
            "condition": alert.condition,
            "threshold": alert.threshold,
            "current_value": curr_price,
            "is_triggered": alert.is_triggered,
            "triggered_at": alert.triggered_at.isoformat() if alert.triggered_at else None,
            "created_at": alert.created_at.isoformat(),
        })

    return {"alerts": results}

@router.post("/")
def create_alert(
    req: AlertCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alert = Alert(
        user_id=current_user.id,
        symbol=req.symbol.upper().strip(),
        alert_type=req.alert_type,
        condition=req.condition,
        threshold=req.threshold,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return {"status": "created", "id": alert.id}

@router.post("/{alert_id}/reset")
def reset_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alert = db.get(Alert, alert_id)
    if not alert or (alert.user_id != current_user.id and current_user.role != "admin"):
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_triggered = False
    alert.triggered_at = None
    db.add(alert)
    db.commit()
    return {"status": "reset", "id": alert_id}

@router.delete("/{alert_id}")
def delete_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alert = db.get(Alert, alert_id)
    if not alert or (alert.user_id != current_user.id and current_user.role != "admin"):
        raise HTTPException(status_code=404, detail="Alert not found")
    db.delete(alert)
    db.commit()
    return {"status": "deleted", "id": alert_id}
