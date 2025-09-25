from __future__ import annotations

import json
import secrets
import random
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from sqlalchemy import text

from app.blockchain import CHAIN
from app.db import get_session
from app.models import Company, RewardRule, TokenTransfer, User, Wallet, Interaction
from app.mock_data import (
    SOVICO_COMPANIES,
    CUSTOMER_DATA,
    generate_wallet_address,
    random_date_in_range,
    build_interaction_meta,
    build_transfer_memo,
)

router = APIRouter()

# Data and helpers moved to app.mock_data


@router.post("/seed")
def dev_seed(session: Session = Depends(get_session)):
    if session.exec(select(Company)).first():
        return {"detail": "already seeded"}

    api_key = "sk_demo_company"
    c = Company(name="DemoCo", api_key=api_key)
    session.add(c)
    session.commit()
    session.refresh(c)

    mw = Wallet(owner_type="company", owner_id=c.id, address=f"w_{secrets.token_hex(8)}")
    session.add(mw)
    session.commit()
    CHAIN.mint(mw.address, 500_000)

    r = RewardRule(company_id=c.id, action="purchase", rate=2.0, mode="per_amount")
    session.add(r)
    session.commit()

    u = User(company_id=c.id, full_name="Alice", email="alice@example.com")
    session.add(u)
    session.commit()
    session.refresh(u)

    uw = Wallet(owner_type="user", owner_id=u.id, address=f"w_{secrets.token_hex(8)}")
    session.add(uw)
    session.commit()

    return {"api_key": api_key, "company_id": c.id, "user_id": u.id}


@router.post("/reset")
def reset_all_data(session: Session = Depends(get_session)):
    """Reset all data - delete all companies, users, wallets, transactions, and rules"""
    # Ensure schema is up to date to avoid errors when selecting newer columns
    migrate_schema(session)
    
    # Delete all data in correct order to avoid foreign key constraints
    # First get all records to delete
    transfers = session.exec(select(TokenTransfer)).all()
    interactions = session.exec(select(Interaction)).all()
    rules = session.exec(select(RewardRule)).all()
    wallets = session.exec(select(Wallet)).all()
    users = session.exec(select(User)).all()
    companies = session.exec(select(Company)).all()
    
    # Delete all records
    for transfer in transfers:
        session.delete(transfer)
    for interaction in interactions:
        session.delete(interaction)
    for rule in rules:
        session.delete(rule)
    for wallet in wallets:
        session.delete(wallet)
    for user in users:
        session.delete(user)
    for company in companies:
        session.delete(company)
    
    # Clear blockchain state
    CHAIN.reset()
    
    session.commit()
    
    return {"message": "All data reset successfully"}


@router.post("/migrate")
def migrate_schema(session: Session = Depends(get_session)):
    """Add missing columns to existing SQLite tables to match current models."""
    added: dict[str, list[str]] = {"company": [], "interaction": []}

    # COMPANY TABLE MIGRATION
    company_cols = {row[1] for row in session.exec(text("PRAGMA table_info('company')")).all()}
    company_required = {
        "description": "TEXT",
        "sector": "TEXT",
        "website": "TEXT",
        "phone": "TEXT",
        "email": "TEXT",
        "address": "TEXT",
        "business_license": "TEXT",
        "tax_code": "TEXT",
        "supported_actions": "TEXT",
        "service_categories": "TEXT",
        "is_active": "INTEGER DEFAULT 1",
        "tier": "TEXT",
        "updated_at": "DATETIME",
    }
    for col, type_clause in company_required.items():
        if col not in company_cols:
            session.exec(text(f"ALTER TABLE company ADD COLUMN {col} {type_clause}"))
            added["company"].append(col)

    # INTERACTION TABLE MIGRATION
    try:
        interaction_cols = {row[1] for row in session.exec(text("PRAGMA table_info('interaction')")).all()}
    except Exception:
        interaction_cols = set()
    interaction_required = {
        "transaction_type": "TEXT",
        "status": "TEXT",
        "location": "TEXT",
        "device_type": "TEXT",
        "payment_method": "TEXT",
        "currency": "TEXT",
        "exchange_rate": "REAL",
        "discount_applied": "REAL",
        "tax_amount": "REAL",
        "commission_rate": "REAL",
        "risk_score": "REAL",
        "fraud_detected": "INTEGER",
        "updated_at": "DATETIME",
    }
    for col, type_clause in interaction_required.items():
        if col not in interaction_cols:
            session.exec(text(f"ALTER TABLE interaction ADD COLUMN {col} {type_clause}"))
            added["interaction"].append(col)

    session.commit()
    return {"message": "Migration completed", "added_columns": added}


@router.post("/seed_sovico")
def seed_sovico_data(session: Session = Depends(get_session)):
    """Generate comprehensive Sovico ecosystem mock data with 4 companies, 20 customers, and full transaction history"""
    # Ensure DB schema is up to date before seeding
    migrate_schema(session)
    
    # Clear existing data
    session.exec(select(TokenTransfer)).all()
    session.exec(select(Interaction)).all()
    session.exec(select(RewardRule)).all()
    session.exec(select(Wallet)).all()
    session.exec(select(User)).all()
    session.exec(select(Company)).all()
    
    companies = []
    all_users = []
    all_wallets = []
    
    # Create companies
    for i, company_data in enumerate(SOVICO_COMPANIES):
        api_key = f"sk_sovico_{i+1}_{secrets.token_urlsafe(16)}"
        
        # Convert rules to supported actions
        supported_actions = [rule["action"] for rule in company_data["rules"]]
        
        # Extract service categories from detailed services
        service_categories = []
        if "services" in company_data:
            service_categories = list(set([service["category"].lower() for service in company_data["services"]]))
        else:
            service_categories = [company_data["sector"].lower()]
        
        company = Company(
            name=company_data["name"],
            api_key=api_key,
            description=company_data["description"],
            sector=company_data["sector"],
            website=company_data.get("website", f"https://{company_data['name'].lower().replace(' ', '')}.com"),
            phone=company_data.get("phone", f"+84{random.randint(100000000, 999999999)}"),
            email=company_data.get("email", f"contact@{company_data['name'].lower().replace(' ', '')}.com"),
            address=company_data.get("address", f"123 {company_data['name']} Street, Ho Chi Minh City, Vietnam"),
            business_license=company_data.get("business_license", f"BL{random.randint(100000, 999999)}"),
            tax_code=company_data.get("tax_code", f"TC{random.randint(100000000, 999999999)}"),
            supported_actions=json.dumps(supported_actions),
            service_categories=json.dumps(service_categories),
            tier=company_data.get("tier", "premium"),
            is_active=True,
            created_at=random_date_in_range(90)
        )
        session.add(company)
        session.commit()
        session.refresh(company)
        companies.append(company)
        
        # Create master wallet with substantial funds
        master_wallet = Wallet(
            owner_type="company",
            owner_id=company.id,
            address=generate_wallet_address()
        )
        session.add(master_wallet)
        session.commit()
        CHAIN.mint(master_wallet.address, random.randint(1000000, 5000000))
        all_wallets.append(master_wallet)
        
        # Create reward rules
        for rule_data in company_data["rules"]:
            rule = RewardRule(
                company_id=company.id,
                action=rule_data["action"],
                rate=rule_data["rate"],
                mode=rule_data["mode"],
                is_active=True,
                created_at=random_date_in_range(60)
            )
            session.add(rule)
            session.commit()
    
    # Create 20 customers (5 per company)
    for i, customer_data in enumerate(CUSTOMER_DATA):
        company = companies[i % 4]  # Distribute across 4 companies
        
        user = User(
            company_id=company.id,
            full_name=customer_data["name"],
            email=customer_data["email"],
            phone=customer_data["phone"],
            segment=customer_data["segment"],
            created_at=random_date_in_range(60)
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        all_users.append(user)
        
        # Create user wallet
        user_wallet = Wallet(
            owner_type="user",
            owner_id=user.id,
            address=generate_wallet_address()
        )
        session.add(user_wallet)
        session.commit()
        
        # Give user some initial SOV tokens
        initial_balance = random.randint(10000, 100000)
        CHAIN.mint(user_wallet.address, initial_balance)
        all_wallets.append(user_wallet)
    
    # Generate transaction history (last 30 days)
    interactions = []
    transfers = []
    
    # Generate company-to-user reward transactions (100 transactions)
    for _ in range(100):
        user = random.choice(all_users)
        # Random company (not necessarily user's own company)
        company = random.choice(companies)
        
        # Get company's master wallet
        master_wallet = next(w for w in all_wallets if w.owner_type == "company" and w.owner_id == company.id)
        user_wallet = next(w for w in all_wallets if w.owner_type == "user" and w.owner_id == user.id)
        
        # Get random rule for this company
        rules = session.exec(select(RewardRule).where(RewardRule.company_id == company.id)).all()
        rule = random.choice(rules) if rules else None
        
        # Generate transaction amount based on action type
        if rule and "amount" in rule.mode:
            amount = random.randint(50000, 2000000)  # 50k-2M VND
        else:
            amount = random.randint(100000, 500000)  # 100k-500k VND
        
        # Create interaction with enhanced fields for data analysis
        interaction = Interaction(
            user_id=user.id,
            company_id=company.id,
            service=company.name,
            action=rule.action if rule else "general_service",
            amount=amount,
            transaction_type="reward",
            status="completed",
            location=random.choice(["online", "mobile", "branch"]),
            device_type=random.choice(["mobile", "desktop", "tablet"]),
            payment_method=random.choice(["card", "transfer", "qr"]),
            currency="VND",
            exchange_rate=1.0,
            discount_applied=random.choice([0, 0, 0, random.randint(5000, 50000)]),  # 25% chance of discount
            tax_amount=amount * 0.1 if random.random() < 0.3 else 0,  # 30% chance of tax
            commission_rate=random.uniform(0.01, 0.05),
            risk_score=random.uniform(0.1, 0.9),
            fraud_detected=False,
            meta=build_interaction_meta(
                company={"name": company.name, "sector": next((c["sector"] for c in SOVICO_COMPANIES if c["name"] == company.name), None)},
                user={"name": user.full_name},
                rule=next((r for r in (next((c["rules"] for c in SOVICO_COMPANIES if c["name"] == company.name), [])) if r["action"] == (rule.action if rule else "general_service")), None),
                amount=amount,
                extra={"direction": "company_to_user"},
            ),
            created_at=random_date_in_range(30)
        )
        session.add(interaction)
        session.commit()
        session.refresh(interaction)
        interactions.append(interaction)
        
        # Calculate reward
        reward = 0
        if rule:
            if rule.mode == "per_amount":
                reward = (amount / 10000.0) * rule.rate
            else:  # flat
                reward = rule.rate
        
        # Create transfer if there's a reward
        if reward > 0:
            try:
                tx_hash = CHAIN.transfer(master_wallet.address, user_wallet.address, reward)
                transfer = TokenTransfer(
                    tx_hash=tx_hash,
                    from_wallet=master_wallet.address,
                    to_wallet=user_wallet.address,
                    amount=reward,
                    memo=build_transfer_memo("reward", {"company": company.name, "action": rule.action if rule else None, "amount_sov": reward}),
                    created_at=interaction.created_at
                )
                session.add(transfer)
                session.commit()
                transfers.append(transfer)
            except Exception:
                # If transfer fails, mint more to master wallet
                CHAIN.mint(master_wallet.address, reward)
                tx_hash = CHAIN.transfer(master_wallet.address, user_wallet.address, reward)
                transfer = TokenTransfer(
                    tx_hash=tx_hash,
                    from_wallet=master_wallet.address,
                    to_wallet=user_wallet.address,
                    amount=reward,
                    memo=build_transfer_memo("reward", {"company": company.name, "action": rule.action if rule else None, "amount_sov": reward}),
                    created_at=interaction.created_at
                )
                session.add(transfer)
                session.commit()
                transfers.append(transfer)
    
    # Generate user-to-company payment transactions (100 transactions)
    for _ in range(100):
        user = random.choice(all_users)
        # Random company (not necessarily user's own company)
        company = random.choice(companies)
        
        # Get company's master wallet
        master_wallet = next(w for w in all_wallets if w.owner_type == "company" and w.owner_id == company.id)
        user_wallet = next(w for w in all_wallets if w.owner_type == "user" and w.owner_id == user.id)
        
        # Generate payment amount
        payment_amount = random.randint(100000, 5000000)  # 100k-5M VND
        
        # Create interaction for payment with enhanced fields
        interaction = Interaction(
            user_id=user.id,
            company_id=company.id,
            service=company.name,
            action="payment",
            amount=payment_amount,
            transaction_type="payment",
            status="completed",
            location=random.choice(["online", "mobile", "branch", "atm"]),
            device_type=random.choice(["mobile", "desktop", "tablet", "pos"]),
            payment_method=random.choice(["card", "cash", "transfer", "qr"]),
            currency="VND",
            exchange_rate=1.0,
            discount_applied=random.choice([0, 0, 0, random.randint(10000, 100000)]),  # 25% chance of discount
            tax_amount=payment_amount * 0.1 if random.random() < 0.2 else 0,  # 20% chance of tax
            commission_rate=random.uniform(0.02, 0.08),
            risk_score=random.uniform(0.2, 0.8),
            fraud_detected=random.random() < 0.05,  # 5% chance of fraud detection
            meta=build_interaction_meta(
                company={"name": company.name, "sector": next((c["sector"] for c in SOVICO_COMPANIES if c["name"] == company.name), None)},
                user={"name": user.full_name},
                rule=None,
                amount=payment_amount,
                extra={"direction": "user_to_company"},
            ),
            created_at=random_date_in_range(30)
        )
        session.add(interaction)
        session.commit()
        session.refresh(interaction)
        interactions.append(interaction)
        
        # Create payment transfer (user pays company)
        try:
            tx_hash = CHAIN.transfer(user_wallet.address, master_wallet.address, payment_amount)
            transfer = TokenTransfer(
                tx_hash=tx_hash,
                from_wallet=user_wallet.address,
                to_wallet=master_wallet.address,
                amount=payment_amount,
                memo=build_transfer_memo("payment", {"company": company.name, "amount_vnd": payment_amount}),
                created_at=interaction.created_at
            )
            session.add(transfer)
            session.commit()
            transfers.append(transfer)
        except Exception:
            # If user doesn't have enough, mint some tokens
            CHAIN.mint(user_wallet.address, payment_amount)
            tx_hash = CHAIN.transfer(user_wallet.address, master_wallet.address, payment_amount)
            transfer = TokenTransfer(
                tx_hash=tx_hash,
                from_wallet=user_wallet.address,
                to_wallet=master_wallet.address,
                amount=payment_amount,
                memo=build_transfer_memo("payment", {"company": company.name, "amount_vnd": payment_amount}),
                created_at=interaction.created_at
            )
            session.add(transfer)
            session.commit()
            transfers.append(transfer)
    
    return {
        "message": "Sovico mock data generated successfully",
        "companies": len(companies),
        "users": len(all_users),
        "wallets": len(all_wallets),
        "interactions": len(interactions),
        "transfers": len(transfers),
        "companies_data": [
            {
                "id": c.id,
                "name": c.name,
                "api_key": c.api_key,
                "created_at": c.created_at
            } for c in companies
        ]
    }


@router.get("/companies")
def dev_list_companies(session: Session = Depends(get_session)):
    try:
        rows = session.exec(select(Company)).all()
    except Exception as exc:  # auto-migrate on schema mismatch, then retry once
        msg = str(exc)
        if "no such column" in msg and "company." in msg:
            migrate_schema(session)
            rows = session.exec(select(Company)).all()
        else:
            raise
    return [ {"id": c.id, "name": c.name, "api_key": c.api_key, "created_at": c.created_at} for c in rows ]


@router.get("/wallets")
def dev_list_wallets(session: Session = Depends(get_session)):
    rows = session.exec(select(Wallet)).all()
    return [ {"id": w.id, "owner_type": w.owner_type, "owner_id": w.owner_id, "address": w.address, "balance": CHAIN.balance_of(w.address)} for w in rows ]


@router.get("/transfers")
def dev_list_transfers(limit: int = 50, session: Session = Depends(get_session)):
    rows = session.exec(select(TokenTransfer).order_by(TokenTransfer.created_at.desc())).all()
    rows = rows[:limit]
    return [ {"id": t.id, "tx_hash": t.tx_hash, "from_wallet": t.from_wallet, "to_wallet": t.to_wallet, "amount": t.amount, "memo": t.memo, "created_at": t.created_at} for t in rows ]


@router.get("/users/{user_id}/transactions")
def get_user_transactions(user_id: int, limit: int = 20, session: Session = Depends(get_session)):
    """Get detailed transaction history for a specific user"""
    # Get user's interactions with enhanced details
    interactions = session.exec(
        select(Interaction)
        .where(Interaction.user_id == user_id)
        .order_by(Interaction.created_at.desc())
        .limit(limit)
    ).all()
    
    # Get user's token transfers
    user_wallets = session.exec(
        select(Wallet).where(Wallet.owner_type == "user", Wallet.owner_id == user_id)
    ).all()
    user_wallet_addresses = [w.address for w in user_wallets]
    
    transfers = session.exec(
        select(TokenTransfer)
        .where(
            (TokenTransfer.from_wallet.in_(user_wallet_addresses)) |
            (TokenTransfer.to_wallet.in_(user_wallet_addresses))
        )
        .order_by(TokenTransfer.created_at.desc())
        .limit(limit)
    ).all()
    
    # Get company names for context
    companies = session.exec(select(Company)).all()
    company_map = {c.id: c.name for c in companies}
    
    return {
        "user_id": user_id,
        "interactions": [
            {
                "id": i.id,
                "company_name": company_map.get(i.company_id, "Unknown"),
                "service": i.service,
                "action": i.action,
                "amount": i.amount,
                "transaction_type": i.transaction_type,
                "status": i.status,
                "location": i.location,
                "device_type": i.device_type,
                "payment_method": i.payment_method,
                "currency": i.currency,
                "discount_applied": i.discount_applied,
                "tax_amount": i.tax_amount,
                "risk_score": i.risk_score,
                "fraud_detected": i.fraud_detected,
                "created_at": i.created_at,
                "meta": i.meta
            } for i in interactions
        ],
        "transfers": [
            {
                "id": t.id,
                "tx_hash": t.tx_hash,
                "from_wallet": t.from_wallet,
                "to_wallet": t.to_wallet,
                "amount": t.amount,
                "memo": t.memo,
                "created_at": t.created_at,
                "direction": "outgoing" if t.from_wallet in user_wallet_addresses else "incoming"
            } for t in transfers
        ]
    }


@router.post("/demo/purchase")
def dev_demo_purchase(company_id: int, amount: float = 200000, session: Session = Depends(get_session)):
    c = session.get(Company, company_id)
    if not c:
        raise HTTPException(404, "Company not found")

    # ensure at least one user and a user wallet for the company
    user = session.exec(select(User).where(User.company_id == company_id)).first()
    if not user:
        user = User(company_id=company_id, full_name="Demo User", email=f"demo_{secrets.token_hex(3)}@example.com")
        session.add(user); session.commit(); session.refresh(user)
    uw = session.exec(select(Wallet).where(Wallet.owner_type=="user", Wallet.owner_id==user.id)).first()
    if not uw:
        uw = Wallet(owner_type="user", owner_id=user.id, address=f"w_{secrets.token_hex(8)}")
        session.add(uw); session.commit()

    # ensure a master wallet exists and has funds
    mw = session.exec(select(Wallet).where(Wallet.owner_type=="company", Wallet.owner_id==company_id)).first()
    if not mw:
        mw = Wallet(owner_type="company", owner_id=company_id, address=f"w_{secrets.token_hex(8)}")
        session.add(mw); session.commit()
        CHAIN.mint(mw.address, 500_000)
    # top-up if needed
    if CHAIN.balance_of(mw.address) < 1:
        CHAIN.mint(mw.address, 100_000)

    # ensure an active reward rule exists
    rr = session.exec(select(RewardRule).where(RewardRule.company_id==company_id, RewardRule.action=="purchase", RewardRule.is_active==True)).first()
    if not rr:
        rr = RewardRule(company_id=company_id, action="purchase", rate=2.0, mode="per_amount", is_active=True)
        session.add(rr); session.commit(); session.refresh(rr)

    # record interaction
    it = Interaction(user_id=user.id, company_id=company_id, service=c.name, action="purchase", amount=amount, meta="demo")
    session.add(it); session.commit(); session.refresh(it)

    # compute reward and transfer
    reward = (amount/10000.0)*rr.rate if rr.mode=="per_amount" else rr.rate
    txh = None
    if reward > 0:
        try:
            txh = CHAIN.transfer(mw.address, uw.address, reward)
        except Exception:
            CHAIN.mint(mw.address, reward)
            txh = CHAIN.transfer(mw.address, uw.address, reward)
        tx = TokenTransfer(tx_hash=txh, from_wallet=mw.address, to_wallet=uw.address, amount=reward, memo="demo purchase")
        session.add(tx); session.commit()

    return {
        "interaction_id": it.id,
        "user_id": user.id,
        "company_wallet": mw.address,
        "user_wallet": uw.address,
        "reward": reward,
        "tx_hash": txh,
    }


@router.post("/user_purchase")
def dev_user_purchase(company_id: int, user_id: int, amount: float = 200000, session: Session = Depends(get_session)):
    # Validate company and user
    company = session.get(Company, company_id)
    if not company:
        raise HTTPException(404, "Company not found")

    user = session.get(User, user_id)
    if not user or user.company_id != company_id:
        raise HTTPException(404, "User not found for this company")

    # Ensure user wallet
    uw = session.exec(select(Wallet).where(Wallet.owner_type=="user", Wallet.owner_id==user.id)).first()
    if not uw:
        uw = Wallet(owner_type="user", owner_id=user.id, address=f"w_{secrets.token_hex(8)}")
        session.add(uw); session.commit()

    # Ensure master wallet with funds
    mw = session.exec(select(Wallet).where(Wallet.owner_type=="company", Wallet.owner_id==company_id)).first()
    if not mw:
        mw = Wallet(owner_type="company", owner_id=company_id, address=f"w_{secrets.token_hex(8)}")
        session.add(mw); session.commit()
        CHAIN.mint(mw.address, 500_000)
    if CHAIN.balance_of(mw.address) < 1:
        CHAIN.mint(mw.address, 100_000)

    # Ensure active reward rule
    rr = session.exec(select(RewardRule).where(RewardRule.company_id==company_id, RewardRule.action=="purchase", RewardRule.is_active==True)).first()
    if not rr:
        rr = RewardRule(company_id=company_id, action="purchase", rate=2.0, mode="per_amount", is_active=True)
        session.add(rr); session.commit(); session.refresh(rr)

    # Record interaction
    it = Interaction(user_id=user.id, company_id=company_id, service=company.name, action="purchase", amount=amount, meta="demo_user_purchase")
    session.add(it); session.commit(); session.refresh(it)

    # Compute reward and transfer
    reward = (amount/10000.0)*rr.rate if rr.mode=="per_amount" else rr.rate
    txh = None
    if reward > 0:
        try:
            txh = CHAIN.transfer(mw.address, uw.address, reward)
        except Exception:
            CHAIN.mint(mw.address, reward)
            txh = CHAIN.transfer(mw.address, uw.address, reward)
        tx = TokenTransfer(tx_hash=txh, from_wallet=mw.address, to_wallet=uw.address, amount=reward, memo="demo user purchase")
        session.add(tx); session.commit()

    return {
        "interaction_id": it.id,
        "user_id": user.id,
        "company_wallet": mw.address,
        "user_wallet": uw.address,
        "reward": reward,
        "tx_hash": txh,
    }
