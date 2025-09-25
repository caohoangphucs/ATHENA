from __future__ import annotations

import secrets
from typing import Optional

from fastapi import HTTPException
from sqlmodel import Session, select

from app.blockchain import CHAIN
from app.models import Company, Interaction, RewardRule, TokenTransfer, User, Wallet


# DB helpers

def get_wallet(session: Session, owner_type: str, owner_id: int) -> Wallet:
    wallet = session.exec(
        select(Wallet).where(Wallet.owner_type == owner_type, Wallet.owner_id == owner_id)
    ).first()
    if not wallet:
        raise HTTPException(404, "Wallet not found")
    return wallet


def user_check_company(session: Session, user_id: int, company_id: int) -> User:
    user = session.get(User, user_id)
    if not user or user.company_id != company_id:
        raise HTTPException(404, "User not found in your company")
    return user


def user_out(session: Session, user: User):
    from app.schemas import UserOut, WalletOut

    w = get_wallet(session, "user", user.id)
    return UserOut(
        id=user.id,
        company_id=user.company_id,
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        segment=user.segment,
        wallet=WalletOut(address=w.address, balance=CHAIN.balance_of(w.address)),
        created_at=user.created_at,
    )


def apply_reward(
    session: Session, company_id: int, user_id: int, action: str, amount: Optional[float]
) -> float:
    rules = session.exec(
        select(RewardRule).where(
            RewardRule.company_id == company_id,
            RewardRule.action == action,
            RewardRule.is_active == True,  # noqa: E712
        )
    ).all()
    if not rules:
        return 0.0

    total_reward = 0.0
    for r in rules:
        if r.mode == "per_amount":
            if amount and amount > 0:
                total_reward += (amount / 10_000.0) * r.rate
        else:
            total_reward += r.rate

    if total_reward <= 0:
        return 0.0

    master = get_wallet(session, "company", company_id)
    uw = get_wallet(session, "user", user_id)
    try:
        txh = CHAIN.transfer(master.address, uw.address, total_reward)
    except ValueError:
        CHAIN.mint(master.address, total_reward)
        txh = CHAIN.transfer(master.address, uw.address, total_reward)

    tx = TokenTransfer(
        tx_hash=txh,
        from_wallet=master.address,
        to_wallet=uw.address,
        amount=total_reward,
        memo=f"reward:{action}",
    )
    session.add(tx)
    session.commit()
    return total_reward


def create_master_wallet_with_funds(session: Session, company: Company) -> Wallet:
    master_addr = f"w_{secrets.token_hex(8)}"
    wallet = Wallet(owner_type="company", owner_id=company.id, address=master_addr)
    session.add(wallet)
    session.commit()
    CHAIN.mint(master_addr, 1_000_000)
    return wallet


def create_user_with_wallet(
    session: Session, company_id: int, full_name: str, email: str, phone: Optional[str], segment: Optional[str]
) -> User:
    user = User(
        company_id=company_id,
        full_name=full_name,
        email=email,
        phone=phone,
        segment=segment,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    addr = f"w_{secrets.token_hex(8)}"
    wallet = Wallet(owner_type="user", owner_id=user.id, address=addr)
    session.add(wallet)
    session.commit()
    return user
