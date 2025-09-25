from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.auth import AuthedCompany, require_company
from app.db import get_session
from app.schemas import UserCreateIn, UserOut, UserUpdateIn
from app.services import user_check_company, user_out, create_user_with_wallet

router = APIRouter()


@router.post("", response_model=UserOut)
def create_user(
    payload: UserCreateIn,
    auth: AuthedCompany = Depends(require_company),
    session: Session = Depends(get_session),
) -> UserOut:
    user = create_user_with_wallet(
        session,
        company_id=auth.id,
        full_name=payload.full_name,
        email=payload.email,
        phone=payload.phone,
        segment=payload.segment,
    )
    return user_out(session, user)


@router.get("/{user_id}", response_model=UserOut)
def get_user(
    user_id: int,
    auth: AuthedCompany = Depends(require_company),
    session: Session = Depends(get_session),
) -> UserOut:
    user = user_check_company(session, user_id, auth.id)
    return user_out(session, user)


@router.put("/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    payload: UserUpdateIn,
    auth: AuthedCompany = Depends(require_company),
    session: Session = Depends(get_session),
) -> UserOut:
    user = user_check_company(session, user_id, auth.id)
    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.phone is not None:
        user.phone = payload.phone
    if payload.segment is not None:
        user.segment = payload.segment
    session.add(user)
    session.commit()
    return user_out(session, user)
