from __future__ import annotations

from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, EmailStr, Field


class CompanySignupIn(BaseModel):
    name: str
    description: Optional[str] = None
    sector: Optional[str] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    business_license: Optional[str] = None
    tax_code: Optional[str] = None
    supported_actions: Optional[List[str]] = None
    service_categories: Optional[List[str]] = None
    tier: Optional[str] = "basic"


class CompanySignupOut(BaseModel):
    company_id: int
    api_key: str


class CompanyOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    sector: Optional[str]
    website: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    address: Optional[str]
    business_license: Optional[str]
    tax_code: Optional[str]
    supported_actions: Optional[List[str]]
    service_categories: Optional[List[str]]
    is_active: bool
    tier: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]


class CompanyUpdateIn(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    sector: Optional[str] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    business_license: Optional[str] = None
    tax_code: Optional[str] = None
    supported_actions: Optional[List[str]] = None
    service_categories: Optional[List[str]] = None
    is_active: Optional[bool] = None
    tier: Optional[str] = None


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
