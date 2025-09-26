from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.auth import AuthedCompany, require_company
from app.blockchain import CHAIN
from app.db import get_session
from app.models import User, Wallet, TokenTransfer
from app.schemas import TxOut, WalletOut
from app.services import get_wallet, user_check_company

router = APIRouter()


@router.get("/{owner_type}/{owner_id}", response_model=WalletOut)
def get_wallet_endpoint(
    owner_type: str,
    owner_id: int,
    auth: AuthedCompany = Depends(require_company),
    session: Session = Depends(get_session),
) -> WalletOut:
    if owner_type not in {"company", "user"}:
        raise HTTPException(400, "owner_type must be 'company' or 'user'")
    if owner_type == "user":
        user_check_company(session, owner_id, auth.id)
    else:
        if owner_id != auth.id:
            raise HTTPException(403, "Not your company")
    w = session.exec(
        select(Wallet).where(Wallet.owner_type == owner_type, Wallet.owner_id == owner_id)
    ).first()
    if not w:
        raise HTTPException(404, "Wallet not found")
    return WalletOut(address=w.address, balance=CHAIN.balance_of(w.address))


@router.post("/mockchain/transfer", response_model=TxOut)
def mock_transfer(
    from_owner_type: str,
    from_owner_id: int,
    to_owner_type: str,
    to_owner_id: int,
    amount: float,
    auth: AuthedCompany = Depends(require_company),
    session: Session = Depends(get_session),
) -> TxOut:
    if from_owner_type == "user":
        user_check_company(session, from_owner_id, auth.id)
    if to_owner_type == "user":
        user_check_company(session, to_owner_id, auth.id)
    if from_owner_type == "company" and from_owner_id != auth.id:
        raise HTTPException(403, "Cannot move from other company")
    if to_owner_type == "company" and to_owner_id != auth.id:
        raise HTTPException(403, "Cannot move to other company")

    wf = get_wallet(session, from_owner_type, from_owner_id)
    wt = get_wallet(session, to_owner_type, to_owner_id)

    try:
        txh = CHAIN.transfer(wf.address, wt.address, amount)
    except ValueError as e:
        raise HTTPException(400, str(e))

    tx = TokenTransfer(
        tx_hash=txh,
        from_wallet=wf.address,
        to_wallet=wt.address,
        amount=amount,
        memo="manual transfer",
    )
    session.add(tx)
    session.commit()
    return TxOut(tx_hash=txh, amount=amount, from_wallet=wf.address, to_wallet=wt.address)
