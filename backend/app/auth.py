from __future__ import annotations

from fastapi import Depends, Header, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from app.db import get_session
from app.models import Company


class AuthedCompany(BaseModel):
    id: int
    name: str
    api_key: str


def require_company(
    x_api_key: str = Header(..., alias="X-API-Key"),
    session: Session = Depends(get_session),
) -> AuthedCompany:
    company = session.exec(select(Company).where(Company.api_key == x_api_key)).first()
    if not company:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return AuthedCompany(id=company.id, name=company.name, api_key=company.api_key)
