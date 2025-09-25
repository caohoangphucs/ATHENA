from __future__ import annotations

from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, EmailStr, Field


class CompanySignupIn(BaseModel):
    name: str


class CompanySignupOut(BaseModel):
    company_id: int
    api_key: str


class WalletOut(BaseModel):
    address: str
    balance: float


class UserCreateIn(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    segment: Optional[str] = None


class UserOut(BaseModel):
    id: int
    company_id: int
    full_name: str
    email: EmailStr
    phone: Optional[str]
    segment: Optional[str]
    wallet: WalletOut
    created_at: datetime


class UserUpdateIn(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    segment: Optional[str] = None


class InteractionIn(BaseModel):
    user_id: int
    service: str
    action: str
    amount: Optional[float] = None
    meta: Optional[str] = None


class InteractionOut(BaseModel):
    id: int
    reward_tokens: float = 0.0


class RuleCreateIn(BaseModel):
    action: str = Field(examples=["purchase"])
    rate: float = Field(examples=[1.0], description="Tokens per 10k VND or flat")
    mode: str = Field(default="per_amount", examples=["per_amount", "flat"])


class TxOut(BaseModel):
    tx_hash: str
    amount: float
    from_wallet: Optional[str]
    to_wallet: Optional[str]


class ContractCreateIn(BaseModel):
    name: str
    action: str
    mode: str = "per_amount"
    rate: float = 1.0


class ContractOut(BaseModel):
    id: int
    name: str
    action: str
    mode: str
    rate: float
    is_active: bool


class ContractEventIn(BaseModel):
    user_id: int
    amount: Optional[float] = None
    meta: Optional[str] = None
