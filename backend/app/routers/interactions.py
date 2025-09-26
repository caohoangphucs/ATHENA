from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.auth import AuthedCompany, require_company
from app.db import get_session
from app.models import Interaction
from app.schemas import InteractionIn, InteractionOut
from app.services import apply_reward, user_check_company

router = APIRouter()


@router.post("", response_model=InteractionOut)
def create_interaction(
    payload: InteractionIn,
    auth: AuthedCompany = Depends(require_company),
    session: Session = Depends(get_session),
) -> InteractionOut:
    user = user_check_company(session, payload.user_id, auth.id)
    it = Interaction(
        user_id=user.id,
        company_id=auth.id,
        service=payload.service,
        action=payload.action,
        amount=payload.amount,
        meta=payload.meta,
    )
    session.add(it)
    session.commit()
    session.refresh(it)

    reward = apply_reward(session, auth.id, user.id, payload.action, payload.amount)
    return InteractionOut(id=it.id, reward_tokens=reward)


@router.get("/users/{user_id}/history", response_model=List[Interaction])
def user_history(
    user_id: int,
    auth: AuthedCompany = Depends(require_company),
    session: Session = Depends(get_session),
):
    _ = user_check_company(session, user_id, auth.id)
    rows = session.exec(
        select(Interaction).where(Interaction.user_id == user_id).order_by(Interaction.created_at.desc())
    ).all()
    return rows
