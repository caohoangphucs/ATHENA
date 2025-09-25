from __future__ import annotations

import secrets

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.auth import AuthedCompany, require_company
from app.db import get_session
from app.models import Company, Wallet
from app.schemas import CompanySignupIn, CompanySignupOut, WalletOut
from app.services import create_master_wallet_with_funds
from app.blockchain import CHAIN

router = APIRouter()


@router.post("/signup", response_model=CompanySignupOut)
def company_signup(payload: CompanySignupIn, session: Session = Depends(get_session)) -> CompanySignupOut:
    api_key = "sk_" + secrets.token_urlsafe(24)
    company = Company(name=payload.name, api_key=api_key)
    session.add(company)
    session.commit()
    session.refresh(company)

    create_master_wallet_with_funds(session, company)
    return CompanySignupOut(company_id=company.id, api_key=api_key)


@router.get("/wallets/master", response_model=WalletOut)
def get_master_wallet(auth: AuthedCompany = Depends(require_company), session: Session = Depends(get_session)) -> WalletOut:
    w = session.exec(
        select(Wallet).where(Wallet.owner_type == "company", Wallet.owner_id == auth.id)
    ).first()
    if not w:
        raise HTTPException(404, "Master wallet not found")
    return WalletOut(address=w.address, balance=CHAIN.balance_of(w.address))
