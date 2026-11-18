from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from backend.app.core.deps import get_db, get_current_user_optional, get_current_user
from backend.app.models.user import User
from backend.app.models.portfolio import Portfolio
from backend.app.services.data_provider import get_data_provider

router = APIRouter(prefix="/portfolio", tags=["Portfolio"])

class HoldingCreate(BaseModel):
    symbol: str
    asset_type: str = "stock"  # stock, fund, option
    shares: float = Field(..., gt=0)
    avg_cost: float = Field(..., gt=0)
    target_allocation_pct: float = Field(default=0.0, ge=0, le=100)
    notes: Optional[str] = None

class HoldingUpdate(BaseModel):
    shares: Optional[float] = Field(None, gt=0)
    avg_cost: Optional[float] = Field(None, gt=0)
    target_allocation_pct: Optional[float] = Field(None, ge=0, le=100)
    notes: Optional[str] = None

@router.get("/")
def get_portfolio(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    user_id = current_user.id if current_user else 1
    holdings_db = db.exec(select(Portfolio).where(Portfolio.user_id == user_id)).all()

    # If new user has empty portfolio, seed default realistic demo holdings
    if not holdings_db and (not current_user or current_user.username == "admin"):
        sample_holdings = [
            Portfolio(user_id=user_id, symbol="AAPL", asset_type="stock", shares=50, avg_cost=180.0, target_allocation_pct=25.0, notes="Core tech holding"),
            Portfolio(user_id=user_id, symbol="MSFT", asset_type="stock", shares=30, avg_cost=400.0, target_allocation_pct=25.0, notes="Enterprise cloud"),
            Portfolio(user_id=user_id, symbol="NVDA", asset_type="stock", shares=80, avg_cost=110.0, target_allocation_pct=25.0, notes="AI compute"),
            Portfolio(user_id=user_id, symbol="SPY", asset_type="fund", shares=40, avg_cost=520.0, target_allocation_pct=25.0, notes="Broad market index"),
        ]
        for h in sample_holdings:
            db.add(h)
        db.commit()
        holdings_db = db.exec(select(Portfolio).where(Portfolio.user_id == user_id)).all()

    provider = get_data_provider()
    holdings_enriched = []
    total_cost_basis = 0.0
    total_market_value = 0.0

    for h in holdings_db:
        quote = provider.get_quote(h.symbol)
        curr_price = float(quote.get("price", h.avg_cost))
        market_val = h.shares * curr_price
        cost_val = h.shares * h.avg_cost
        unrealized_pnl = market_val - cost_val
        pnl_pct = ((curr_price - h.avg_cost) / h.avg_cost * 100) if h.avg_cost > 0 else 0.0

        total_cost_basis += cost_val
        total_market_value += market_val

        holdings_enriched.append({
            "id": h.id,
            "symbol": h.symbol,
            "name": quote.get("name", h.symbol),
            "asset_type": h.asset_type,
            "shares": h.shares,
            "avg_cost": round(h.avg_cost, 2),
            "current_price": round(curr_price, 2),
            "market_value": round(market_val, 2),
            "cost_basis": round(cost_val, 2),
            "unrealized_pnl": round(unrealized_pnl, 2),
            "return_pct": round(pnl_pct, 2),
            "target_allocation_pct": h.target_allocation_pct,
            "notes": h.notes,
        })

    # Calculate actual weights and rebalancing actions
    for h in holdings_enriched:
        actual_pct = (h["market_value"] / total_market_value * 100) if total_market_value > 0 else 0.0
        h["actual_allocation_pct"] = round(actual_pct, 2)
        diff_pct = h["target_allocation_pct"] - actual_pct
        target_value = (h["target_allocation_pct"] / 100.0) * total_market_value
        rebalance_diff = target_value - h["market_value"]
        h["rebalance_delta_usd"] = round(rebalance_diff, 2)
        h["rebalance_action"] = "BUY" if rebalance_diff > 50 else ("SELL" if rebalance_diff < -50 else "HOLD")

    total_pnl = total_market_value - total_cost_basis
    total_return_pct = (total_pnl / total_cost_basis * 100) if total_cost_basis > 0 else 0.0

    return {
        "summary": {
            "total_market_value": round(total_market_value, 2),
            "total_cost_basis": round(total_cost_basis, 2),
            "total_unrealized_pnl": round(total_pnl, 2),
            "total_return_pct": round(total_return_pct, 2),
            "positions_count": len(holdings_enriched),
        },
        "holdings": holdings_enriched,
    }

@router.post("/")
def add_holding(
    req: HoldingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sym = req.symbol.upper().strip()
    existing = db.exec(
        select(Portfolio).where(Portfolio.user_id == current_user.id, Portfolio.symbol == sym)
    ).first()

    if existing:
        # Update existing position
        total_shares = existing.shares + req.shares
        total_cost = (existing.shares * existing.avg_cost) + (req.shares * req.avg_cost)
        existing.avg_cost = total_cost / total_shares if total_shares > 0 else req.avg_cost
        existing.shares = total_shares
        if req.target_allocation_pct > 0:
            existing.target_allocation_pct = req.target_allocation_pct
        if req.notes:
            existing.notes = req.notes
        existing.updated_at = datetime.now(timezone.utc)
        db.add(existing)
        db.commit()
        db.refresh(existing)
        return {"status": "updated", "id": existing.id}

    holding = Portfolio(
        user_id=current_user.id,
        symbol=sym,
        asset_type=req.asset_type,
        shares=req.shares,
        avg_cost=req.avg_cost,
        target_allocation_pct=req.target_allocation_pct,
        notes=req.notes,
    )
    db.add(holding)
    db.commit()
    db.refresh(holding)
    return {"status": "created", "id": holding.id}

@router.put("/{holding_id}")
def update_holding(
    holding_id: int,
    req: HoldingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    holding = db.get(Portfolio, holding_id)
    if not holding or (holding.user_id != current_user.id and current_user.role != "admin"):
        raise HTTPException(status_code=404, detail="Holding not found")

    if req.shares is not None:
        holding.shares = req.shares
    if req.avg_cost is not None:
        holding.avg_cost = req.avg_cost
    if req.target_allocation_pct is not None:
        holding.target_allocation_pct = req.target_allocation_pct
    if req.notes is not None:
        holding.notes = req.notes
    holding.updated_at = datetime.now(timezone.utc)

    db.add(holding)
    db.commit()
    db.refresh(holding)
    return {"status": "updated", "id": holding.id}

@router.delete("/{holding_id}")
def delete_holding(
    holding_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    holding = db.get(Portfolio, holding_id)
    if not holding or (holding.user_id != current_user.id and current_user.role != "admin"):
        raise HTTPException(status_code=404, detail="Holding not found")
    db.delete(holding)
    db.commit()
    return {"status": "deleted", "id": holding_id}
