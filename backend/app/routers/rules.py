from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.auth import AuthedCompany, require_company
from app.db import get_session
from app.models import RewardRule

router = APIRouter()


@router.post("", response_model=RewardRule)
def create_rule(
    payload: RewardRule,
    auth: AuthedCompany = Depends(require_company),
    session: Session = Depends(get_session),
) -> RewardRule:
    rule = RewardRule(
        company_id=auth.id,
        action=payload.action,
        rate=payload.rate,
        mode=payload.mode,
        is_active=True,
    )
    session.add(rule)
    session.commit()
    session.refresh(rule)
    return rule


@router.get("", response_model=List[RewardRule])
def list_rules(
    auth: AuthedCompany = Depends(require_company),
    session: Session = Depends(get_session),
):
    rules = session.exec(
        select(RewardRule).where(RewardRule.company_id == auth.id, RewardRule.is_active == True)  # noqa: E712
    ).all()
    return rules
