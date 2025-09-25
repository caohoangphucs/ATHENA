from __future__ import annotations

import secrets

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.blockchain import CHAIN
from app.db import get_session
from app.models import Company, RewardRule, TokenTransfer, User, Wallet, Interaction

router = APIRouter()


@router.post("/seed")
def dev_seed(session: Session = Depends(get_session)):
    if session.exec(select(Company)).first():
        return {"detail": "already seeded"}

    api_key = "sk_demo_company"
    c = Company(name="DemoCo", api_key=api_key)
    session.add(c)
    session.commit()
    session.refresh(c)

    mw = Wallet(owner_type="company", owner_id=c.id, address=f"w_{secrets.token_hex(8)}")
    session.add(mw)
    session.commit()
    CHAIN.mint(mw.address, 500_000)

    r = RewardRule(company_id=c.id, action="purchase", rate=2.0, mode="per_amount")
    session.add(r)
    session.commit()

    u = User(company_id=c.id, full_name="Alice", email="alice@example.com")
    session.add(u)
    session.commit()
    session.refresh(u)

    uw = Wallet(owner_type="user", owner_id=u.id, address=f"w_{secrets.token_hex(8)}")
    session.add(uw)
    session.commit()

    return {"api_key": api_key, "company_id": c.id, "user_id": u.id}


@router.get("/companies")
def dev_list_companies(session: Session = Depends(get_session)):
    rows = session.exec(select(Company)).all()
    return [ {"id": c.id, "name": c.name, "api_key": c.api_key, "created_at": c.created_at} for c in rows ]


@router.get("/wallets")
def dev_list_wallets(session: Session = Depends(get_session)):
    rows = session.exec(select(Wallet)).all()
    return [ {"id": w.id, "owner_type": w.owner_type, "owner_id": w.owner_id, "address": w.address, "balance": CHAIN.balance_of(w.address)} for w in rows ]


@router.get("/transfers")
def dev_list_transfers(limit: int = 50, session: Session = Depends(get_session)):
    rows = session.exec(select(TokenTransfer).order_by(TokenTransfer.created_at.desc())).all()
    rows = rows[:limit]
    return [ {"id": t.id, "tx_hash": t.tx_hash, "from_wallet": t.from_wallet, "to_wallet": t.to_wallet, "amount": t.amount, "memo": t.memo, "created_at": t.created_at} for t in rows ]


@router.post("/demo/purchase")
def dev_demo_purchase(company_id: int, amount: float = 200000, session: Session = Depends(get_session)):
    c = session.get(Company, company_id)
    if not c:
        raise HTTPException(404, "Company not found")
    # ensure at least one user for the company
    user = session.exec(select(User).where(User.company_id == company_id)).first()
    if not user:
        user = User(company_id=company_id, full_name="Demo User", email=f"demo_{secrets.token_hex(3)}@example.com")
        session.add(user); session.commit(); session.refresh(user)
        uw = Wallet(owner_type="user", owner_id=user.id, address=f"w_{secrets.token_hex(8)}")
        session.add(uw); session.commit()
    # record interaction
    it = Interaction(user_id=user.id, company_id=company_id, service=c.name, action="purchase", amount=amount, meta="demo")
    session.add(it); session.commit(); session.refresh(it)
    # naive reward using existing rules: transfer from master to user (mint if needed)
    mw = session.exec(select(Wallet).where(Wallet.owner_type=="company", Wallet.owner_id==company_id)).first()
    uw = session.exec(select(Wallet).where(Wallet.owner_type=="user", Wallet.owner_id==user.id)).first()
    # find active rule
    rr = session.exec(select(RewardRule).where(RewardRule.company_id==company_id, RewardRule.action=="purchase", RewardRule.is_active==True)).first()
    reward = 0.0
    if rr:
        reward = (amount/10000.0)*rr.rate if rr.mode=="per_amount" else rr.rate
    if reward > 0:
        try:
            txh = CHAIN.transfer(mw.address, uw.address, reward)
        except Exception:
            CHAIN.mint(mw.address, reward)
            txh = CHAIN.transfer(mw.address, uw.address, reward)
        tx = TokenTransfer(tx_hash=txh, from_wallet=mw.address, to_wallet=uw.address, amount=reward, memo="demo purchase")
        session.add(tx); session.commit()
    return {"interaction_id": it.id, "user_id": user.id, "reward": reward}
