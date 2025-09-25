from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import EmailStr
from sqlmodel import Field, SQLModel


class Company(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    api_key: str
    # Service details
    description: Optional[str] = None
    sector: Optional[str] = None  # Finance, Aviation, Real Estate, etc.
    website: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    # Business details
    business_license: Optional[str] = None
    tax_code: Optional[str] = None
    # Service capabilities
    supported_actions: Optional[str] = None  # JSON string of supported actions
    service_categories: Optional[str] = None  # JSON string of service categories
    # Status and metadata
    is_active: bool = True
    tier: Optional[str] = None  # basic, premium, enterprise
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None


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
    # Enhanced fields for data analysis
    transaction_type: Optional[str] = None  # "reward", "payment", "refund", "bonus"
    status: Optional[str] = None  # "completed", "pending", "failed", "cancelled"
    location: Optional[str] = None  # "online", "mobile", "branch", "atm"
    device_type: Optional[str] = None  # "mobile", "desktop", "tablet", "pos"
    payment_method: Optional[str] = None  # "card", "cash", "transfer", "qr"
    currency: Optional[str] = None  # "VND", "USD", "EUR"
    exchange_rate: Optional[float] = None  # For currency conversion
    discount_applied: Optional[float] = None  # Discount amount
    tax_amount: Optional[float] = None  # Tax applied
    commission_rate: Optional[float] = None  # Commission percentage
    risk_score: Optional[float] = None  # Risk assessment score
    fraud_detected: Optional[bool] = None  # Fraud detection flag
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None


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
