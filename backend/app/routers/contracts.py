from __future__ import annotations

import secrets
from typing import List

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlmodel import Session, select

from app.auth import AuthedCompany, require_company
from app.db import get_session
from app.models import Interaction, RewardRule, SmartContract
from app.schemas import ContractCreateIn, ContractEventIn, ContractOut, InteractionOut
from app.services import apply_reward, user_check_company

router = APIRouter()


@router.post("", response_model=ContractOut)
def create_contract(
    payload: ContractCreateIn,
    auth: AuthedCompany = Depends(require_company),
    session: Session = Depends(get_session),
) -> ContractOut:
    secret = secrets.token_urlsafe(24)
    c = SmartContract(
        company_id=auth.id,
        name=payload.name,
        action=payload.action,
        mode=payload.mode,
        rate=payload.rate,
        secret=secret,
    )
    session.add(c)
    session.commit()
    session.refresh(c)

    r = RewardRule(company_id=auth.id, action=c.action, rate=c.rate, mode=c.mode, is_active=True)
    session.add(r)
    session.commit()

    return ContractOut(id=c.id, name=c.name, action=c.action, mode=c.mode, rate=c.rate, is_active=c.is_active)


@router.get("", response_model=List[ContractOut])
def list_contracts(
    auth: AuthedCompany = Depends(require_company),
    session: Session = Depends(get_session),
):
    rows = session.exec(select(SmartContract).where(SmartContract.company_id == auth.id)).all()
    return [
        ContractOut(
            id=i.id, name=i.name, action=i.action, mode=i.mode, rate=i.rate, is_active=i.is_active
        )
        for i in rows
    ]


@router.post("/{cid}/events", response_model=InteractionOut)
def fire_contract_event(
    cid: int,
    payload: ContractEventIn,
    x_contract_secret: str = Header(..., alias="X-Contract-Secret"),
    auth: AuthedCompany = Depends(require_company),
    session: Session = Depends(get_session),
) -> InteractionOut:
    c = session.get(SmartContract, cid)
    if not c or c.company_id != auth.id:
        raise HTTPException(404, "Contract not found")
    if not c.is_active:
        raise HTTPException(400, "Contract inactive")
    if x_contract_secret != c.secret:
        raise HTTPException(401, "Invalid contract secret")

    user = user_check_company(session, payload.user_id, auth.id)
    it = Interaction(
        user_id=user.id,
        company_id=auth.id,
        service=c.name,
        action=c.action,
        amount=payload.amount,
        meta=payload.meta,
    )
    session.add(it)
    session.commit()
    session.refresh(it)

    reward = apply_reward(session, auth.id, user.id, c.action, payload.amount)
    return InteractionOut(id=it.id, reward_tokens=reward)


@router.post("/{cid}/toggle")
def toggle_contract(
    cid: int,
    enable: bool,
    auth: AuthedCompany = Depends(require_company),
    session: Session = Depends(get_session),
):
    c = session.get(SmartContract, cid)
    if not c or c.company_id != auth.id:
        raise HTTPException(404, "Contract not found")
    c.is_active = enable
    session.add(c)
    session.commit()
    return {"id": c.id, "is_active": c.is_active}
