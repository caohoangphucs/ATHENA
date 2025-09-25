from __future__ import annotations

import secrets

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.auth import AuthedCompany, require_company
from app.db import get_session
from app.models import Company, Wallet, User, Interaction, RewardRule, SmartContract, TokenTransfer
from app.schemas import CompanySignupIn, CompanySignupOut, CompanyOut, CompanyUpdateIn, WalletOut
from app.services import create_master_wallet_with_funds
from app.mock_data import SOVICO_COMPANIES
from app.blockchain import CHAIN

router = APIRouter()


@router.post("/signup", response_model=CompanySignupOut)
def company_signup(payload: CompanySignupIn, session: Session = Depends(get_session)) -> CompanySignupOut:
    import json
    from datetime import datetime
    
    api_key = "sk_" + secrets.token_urlsafe(24)
    
    # Convert lists to JSON strings for storage
    supported_actions_json = json.dumps(payload.supported_actions) if payload.supported_actions else None
    service_categories_json = json.dumps(payload.service_categories) if payload.service_categories else None
    
    company = Company(
        name=payload.name,
        api_key=api_key,
        description=payload.description,
        sector=payload.sector,
        website=payload.website,
        phone=payload.phone,
        email=payload.email,
        address=payload.address,
        business_license=payload.business_license,
        tax_code=payload.tax_code,
        supported_actions=supported_actions_json,
        service_categories=service_categories_json,
        tier=payload.tier or "basic",
        is_active=True,
        created_at=datetime.utcnow()
    )
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


@router.delete("/{company_id}")
def delete_company(company_id: int, auth: AuthedCompany = Depends(require_company), session: Session = Depends(get_session)):
    # Only allow company to delete itself
    if auth.id != company_id:
        raise HTTPException(403, "Can only delete your own company")
    
    # Get company
    company = session.get(Company, company_id)
    if not company:
        raise HTTPException(404, "Company not found")
    
    # Get all wallets for this company
    company_wallets = session.exec(
        select(Wallet).where(Wallet.owner_id == company_id)
    ).all()
    
    # Get all users for this company
    company_users = session.exec(
        select(User).where(User.company_id == company_id)
    ).all()
    
    # Get all user wallets for this company's users
    user_wallet_ids = [user.id for user in company_users]
    user_wallets = session.exec(
        select(Wallet).where(Wallet.owner_id.in_(user_wallet_ids), Wallet.owner_type == "user")
    ).all() if user_wallet_ids else []
    
    # Delete all related data
    # 1. Delete token transfers
    transfers_to_delete = session.exec(
        select(TokenTransfer).where(
            (TokenTransfer.from_wallet.in_([w.address for w in company_wallets + user_wallets])) |
            (TokenTransfer.to_wallet.in_([w.address for w in company_wallets + user_wallets]))
        )
    ).all()
    for transfer in transfers_to_delete:
        session.delete(transfer)
    
    # 2. Delete interactions
    interactions_to_delete = session.exec(
        select(Interaction).where(Interaction.company_id == company_id)
    ).all()
    for interaction in interactions_to_delete:
        session.delete(interaction)
    
    # 3. Delete reward rules
    rules_to_delete = session.exec(
        select(RewardRule).where(RewardRule.company_id == company_id)
    ).all()
    for rule in rules_to_delete:
        session.delete(rule)
    
    # 4. Delete smart contracts
    contracts_to_delete = session.exec(
        select(SmartContract).where(SmartContract.company_id == company_id)
    ).all()
    for contract in contracts_to_delete:
        session.delete(contract)
    
    # 5. Delete wallets
    for wallet in company_wallets + user_wallets:
        session.delete(wallet)
    
    # 6. Delete users
    for user in company_users:
        session.delete(user)
    
    # 7. Delete company
    session.delete(company)
    
    session.commit()
    
    return {"message": f"Company '{company.name}' and all associated data deleted successfully"}


def _build_company_services(session: Session, company: Company):
    import json
    # Parse supported actions from company profile
    supported_actions = json.loads(company.supported_actions) if company.supported_actions else []

    # Load reward rules and smart contracts as service definitions
    rules = session.exec(select(RewardRule).where(RewardRule.company_id == company.id, RewardRule.is_active == True)).all()
    contracts = session.exec(select(SmartContract).where(SmartContract.company_id == company.id, SmartContract.is_active == True)).all()

    # Try to enrich with mock_data rule notes/units
    mock_company = next((c for c in SOVICO_COMPANIES if c["name"] == company.name), None)
    mock_rules = {r["action"]: r for r in (mock_company["rules"] if mock_company else [])}

    services = []
    for r in rules:
        extra = mock_rules.get(r.action, {})
        services.append({
            "source": "rule",
            "action": r.action,
            "mode": r.mode,
            "rate": r.rate,
            "unit": extra.get("unit"),
            "notes": extra.get("notes"),
            "is_active": r.is_active,
        })
    for c in contracts:
        extra = mock_rules.get(c.action, {})
        services.append({
            "source": "contract",
            "name": c.name,
            "action": c.action,
            "mode": c.mode,
            "rate": c.rate,
            "unit": extra.get("unit"),
            "notes": extra.get("notes"),
            "is_active": c.is_active,
        })

    # Merge by action keeping both sources; client can group if needed
    return {
        "company_id": company.id,
        "company_name": company.name,
        "supported_actions": supported_actions,
        "services": services,
    }


@router.get("/services")
def list_my_services(auth: AuthedCompany = Depends(require_company), session: Session = Depends(get_session)):
    company = session.get(Company, auth.id)
    if not company:
        raise HTTPException(404, "Company not found")
    return _build_company_services(session, company)


@router.get("/{company_id}/services")
def list_company_services(company_id: int, session: Session = Depends(get_session)):
    company = session.get(Company, company_id)
    if not company:
        raise HTTPException(404, "Company not found")
    return _build_company_services(session, company)


@router.get("/profile", response_model=CompanyOut)
def get_company_profile(auth: AuthedCompany = Depends(require_company), session: Session = Depends(get_session)) -> CompanyOut:
    company = session.get(Company, auth.id)
    if not company:
        raise HTTPException(404, "Company not found")
    
    # Parse JSON strings back to lists
    import json
    supported_actions = json.loads(company.supported_actions) if company.supported_actions else None
    service_categories = json.loads(company.service_categories) if company.service_categories else None
    
    return CompanyOut(
        id=company.id,
        name=company.name,
        description=company.description,
        sector=company.sector,
        website=company.website,
        phone=company.phone,
        email=company.email,
        address=company.address,
        business_license=company.business_license,
        tax_code=company.tax_code,
        supported_actions=supported_actions,
        service_categories=service_categories,
        is_active=company.is_active,
        tier=company.tier,
        created_at=company.created_at,
        updated_at=company.updated_at
    )


@router.put("/profile", response_model=CompanyOut)
def update_company_profile(
    payload: CompanyUpdateIn, 
    auth: AuthedCompany = Depends(require_company), 
    session: Session = Depends(get_session)
) -> CompanyOut:
    import json
    from datetime import datetime
    
    company = session.get(Company, auth.id)
    if not company:
        raise HTTPException(404, "Company not found")
    
    # Update fields if provided
    if payload.name is not None:
        company.name = payload.name
    if payload.description is not None:
        company.description = payload.description
    if payload.sector is not None:
        company.sector = payload.sector
    if payload.website is not None:
        company.website = payload.website
    if payload.phone is not None:
        company.phone = payload.phone
    if payload.email is not None:
        company.email = payload.email
    if payload.address is not None:
        company.address = payload.address
    if payload.business_license is not None:
        company.business_license = payload.business_license
    if payload.tax_code is not None:
        company.tax_code = payload.tax_code
    if payload.supported_actions is not None:
        company.supported_actions = json.dumps(payload.supported_actions)
    if payload.service_categories is not None:
        company.service_categories = json.dumps(payload.service_categories)
    if payload.is_active is not None:
        company.is_active = payload.is_active
    if payload.tier is not None:
        company.tier = payload.tier
    
    company.updated_at = datetime.utcnow()
    
    session.add(company)
    session.commit()
    session.refresh(company)
    
    # Parse JSON strings back to lists for response
    supported_actions = json.loads(company.supported_actions) if company.supported_actions else None
    service_categories = json.loads(company.service_categories) if company.service_categories else None
    
    return CompanyOut(
        id=company.id,
        name=company.name,
        description=company.description,
        sector=company.sector,
        website=company.website,
        phone=company.phone,
        email=company.email,
        address=company.address,
        business_license=company.business_license,
        tax_code=company.tax_code,
        supported_actions=supported_actions,
        service_categories=service_categories,
        is_active=company.is_active,
        tier=company.tier,
        created_at=company.created_at,
        updated_at=company.updated_at
    )
