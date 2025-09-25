from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import EmailStr
from sqlmodel import Field, SQLModel


class Company(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    api_key: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Wallet(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    owner_type: str  # 'company' | 'user'
    owner_id: int
    address: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    company_id: int
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    segment: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Interaction(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int
    company_id: int
    service: str
    action: str
    amount: Optional[float] = None
    meta: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class TokenTransfer(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    tx_hash: str
    from_wallet: Optional[str] = None
    to_wallet: Optional[str] = None
    amount: float
    memo: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class RewardRule(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    company_id: int
    action: str
    rate: float
    mode: str = "per_amount"  # "per_amount" | "flat"
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)


class SmartContract(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    company_id: int
    name: str
    action: str
    mode: str = "per_amount"
    rate: float = 1.0
    is_active: bool = True
    secret: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)
