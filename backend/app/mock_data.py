from __future__ import annotations

import random
import secrets
from datetime import datetime, timedelta
from typing import Dict, Any, List


# Sovico Companies master data with detailed rules and comprehensive services
SOVICO_COMPANIES: List[Dict[str, Any]] = [
    {
        "name": "HDBank",
        "description": "Leading commercial bank providing comprehensive financial services across Vietnam",
        "sector": "Banking",
        "website": "https://hdbank.com.vn",
        "phone": "+84 28 3930 3930",
        "email": "contact@hdbank.com.vn",
        "address": "25Bis Nguyen Thi Minh Khai, District 1, Ho Chi Minh City",
        "business_license": "BL-001234567",
        "tax_code": "0101234567",
        "tier": "premium",
        "services": [
            {
                "category": "Banking",
                "name": "Savings Account",
                "description": "High-yield savings with flexible terms",
                "actions": ["deposit", "withdrawal", "balance_inquiry"]
            },
            {
                "category": "Banking", 
                "name": "Current Account",
                "description": "Business checking account with unlimited transactions",
                "actions": ["deposit", "withdrawal", "transfer", "check_clearing"]
            },
            {
                "category": "Credit",
                "name": "Credit Cards",
                "description": "Premium credit cards with cashback and rewards",
                "actions": ["card_spend", "payment", "cash_advance", "balance_transfer"]
            },
            {
                "category": "Loans",
                "name": "Personal Loans",
                "description": "Quick personal loans with competitive rates",
                "actions": ["loan_application", "loan_disbursement", "loan_repayment"]
            },
            {
                "category": "Investment",
                "name": "Investment Services",
                "description": "Mutual funds, bonds, and securities trading",
                "actions": ["investment_purchase", "investment_sale", "dividend_collection"]
            },
            {
                "category": "Digital",
                "name": "Mobile Banking",
                "description": "Full-featured mobile banking app",
                "actions": ["mobile_transfer", "bill_payment", "qr_payment", "mobile_deposit"]
            }
        ],
        "rules": [
            {"action": "deposit", "rate": 0.01, "mode": "per_amount", "unit": "per 10k VND", "notes": "1% SOV reward on all deposits", "min_amount": 100000, "max_reward": 1000},
            {"action": "card_spend", "rate": 0.02, "mode": "per_amount", "unit": "per 10k VND", "notes": "2% SOV reward on credit card purchases", "min_amount": 50000, "max_reward": 2000},
            {"action": "loan_repayment", "rate": 0.05, "mode": "per_amount", "unit": "per 10k VND", "notes": "5% SOV reward for timely loan repayments", "min_amount": 100000, "max_reward": 5000},
            {"action": "mobile_transfer", "rate": 1.0, "mode": "flat", "unit": "SOV", "notes": "1 SOV per mobile transfer", "min_amount": 10000, "max_reward": 100},
            {"action": "investment_purchase", "rate": 0.03, "mode": "per_amount", "unit": "per 10k VND", "notes": "3% SOV reward on investment purchases", "min_amount": 500000, "max_reward": 3000},
            {"action": "bill_payment", "rate": 0.5, "mode": "flat", "unit": "SOV", "notes": "0.5 SOV per bill payment", "min_amount": 20000, "max_reward": 50}
        ],
    },
    {
        "name": "Vietjet Air",
        "description": "Vietnam's leading low-cost carrier with extensive domestic and international network",
        "sector": "Aviation",
        "website": "https://vietjetair.com",
        "phone": "+84 1900 1886",
        "email": "contact@vietjetair.com",
        "address": "Vietjet Tower, 60A Truong Son, Ward 2, Tan Binh District, Ho Chi Minh City",
        "business_license": "BL-002345678",
        "tax_code": "0102345678",
        "tier": "premium",
        "services": [
            {
                "category": "Flight",
                "name": "Domestic Flights",
                "description": "Domestic flights across Vietnam",
                "actions": ["flight_booking", "check_in", "boarding", "flight_completion"]
            },
            {
                "category": "Flight",
                "name": "International Flights", 
                "description": "International flights to Asia-Pacific",
                "actions": ["flight_booking", "check_in", "boarding", "flight_completion"]
            },
            {
                "category": "Ancillary",
                "name": "Baggage Services",
                "description": "Extra baggage and priority baggage",
                "actions": ["baggage_addon", "priority_baggage", "baggage_tracking"]
            },
            {
                "category": "Ancillary",
                "name": "Seat Selection",
                "description": "Premium seat selection and upgrades",
                "actions": ["seat_selection", "seat_upgrade", "priority_seating"]
            },
            {
                "category": "In-Flight",
                "name": "In-Flight Services",
                "description": "Food, drinks, and duty-free shopping",
                "actions": ["inflight_purchase", "duty_free", "meal_order"]
            },
            {
                "category": "Loyalty",
                "name": "SkyJoy Program",
                "description": "Frequent flyer program with tier benefits",
                "actions": ["loyalty_enrollment", "tier_upgrade", "miles_earning"]
            }
        ],
        "rules": [
            {"action": "flight_booking", "rate": 0.5, "mode": "per_amount", "unit": "per 10k VND", "notes": "0.5% SOV reward on flight bookings", "min_amount": 200000, "max_reward": 500},
            {"action": "check_in", "rate": 2.0, "mode": "flat", "unit": "SOV", "notes": "2 SOV for online check-in", "min_amount": 0, "max_reward": 200},
            {"action": "baggage_addon", "rate": 1.0, "mode": "flat", "unit": "SOV", "notes": "1 SOV per baggage add-on", "min_amount": 100000, "max_reward": 100},
            {"action": "seat_selection", "rate": 0.5, "mode": "flat", "unit": "SOV", "notes": "0.5 SOV per seat selection", "min_amount": 50000, "max_reward": 50},
            {"action": "inflight_purchase", "rate": 0.1, "mode": "per_amount", "unit": "per 10k VND", "notes": "0.1% SOV reward on in-flight purchases", "min_amount": 50000, "max_reward": 100},
            {"action": "loyalty_enrollment", "rate": 10.0, "mode": "flat", "unit": "SOV", "notes": "10 SOV for SkyJoy enrollment", "min_amount": 0, "max_reward": 1000}
        ],
    },
    {
        "name": "Phu Long Real Estate",
        "description": "Leading real estate developer specializing in residential and commercial properties",
        "sector": "Real Estate",
        "website": "https://phulong.com.vn",
        "phone": "+84 28 7300 1888",
        "email": "info@phulong.com.vn",
        "address": "Phu Long Building, 17 Nguyen Hue, District 1, Ho Chi Minh City",
        "business_license": "BL-003456789",
        "tax_code": "0103456789",
        "tier": "premium",
        "services": [
            {
                "category": "Residential",
                "name": "Apartment Sales",
                "description": "Premium apartments in prime locations",
                "actions": ["property_viewing", "property_booking", "property_purchase", "contract_signing"]
            },
            {
                "category": "Residential",
                "name": "House Sales",
                "description": "Luxury villas and townhouses",
                "actions": ["property_viewing", "property_booking", "property_purchase", "contract_signing"]
            },
            {
                "category": "Commercial",
                "name": "Office Rentals",
                "description": "Grade A office spaces for businesses",
                "actions": ["office_viewing", "rental_application", "rental_payment", "lease_renewal"]
            },
            {
                "category": "Commercial",
                "name": "Retail Spaces",
                "description": "Prime retail locations for shops and restaurants",
                "actions": ["retail_viewing", "rental_application", "rental_payment", "lease_renewal"]
            },
            {
                "category": "Property Management",
                "name": "Property Management",
                "description": "Comprehensive property management services",
                "actions": ["maintenance_request", "maintenance_service", "utility_payment", "property_inspection"]
            },
            {
                "category": "Investment",
                "name": "Real Estate Investment",
                "description": "Real estate investment opportunities and REITs",
                "actions": ["investment_consultation", "investment_purchase", "dividend_collection", "investment_sale"]
            }
        ],
        "rules": [
            {"action": "property_viewing", "rate": 10.0, "mode": "flat", "unit": "SOV", "notes": "10 SOV for property viewing", "min_amount": 0, "max_reward": 1000},
            {"action": "property_purchase", "rate": 0.1, "mode": "per_amount", "unit": "per 10k VND", "notes": "0.1% SOV reward on property purchases", "min_amount": 1000000, "max_reward": 10000},
            {"action": "rental_payment", "rate": 0.02, "mode": "per_amount", "unit": "per 10k VND", "notes": "0.02% SOV reward on rental payments", "min_amount": 500000, "max_reward": 2000},
            {"action": "maintenance_service", "rate": 5.0, "mode": "flat", "unit": "SOV", "notes": "5 SOV for maintenance service usage", "min_amount": 100000, "max_reward": 500},
            {"action": "contract_signing", "rate": 50.0, "mode": "flat", "unit": "SOV", "notes": "50 SOV for contract signing", "min_amount": 0, "max_reward": 5000},
            {"action": "investment_purchase", "rate": 0.05, "mode": "per_amount", "unit": "per 10k VND", "notes": "0.05% SOV reward on real estate investments", "min_amount": 2000000, "max_reward": 5000}
        ],
    },
    {
        "name": "HD Saison Finance",
        "description": "Consumer finance company providing credit cards, personal loans, and financial services",
        "sector": "Consumer Finance",
        "website": "https://hdsaison.com.vn",
        "phone": "+84 28 7300 1888",
        "email": "support@hdsaison.com.vn",
        "address": "HD Saison Building, 25 Le Loi, District 1, Ho Chi Minh City",
        "business_license": "BL-004567890",
        "tax_code": "0104567890",
        "tier": "premium",
        "services": [
            {
                "category": "Credit Cards",
                "name": "Credit Cards",
                "description": "Premium credit cards with rewards and benefits",
                "actions": ["card_application", "card_spend", "card_payment", "cash_advance"]
            },
            {
                "category": "Personal Loans",
                "name": "Personal Loans",
                "description": "Quick personal loans with flexible terms",
                "actions": ["loan_application", "loan_approval", "loan_disbursement", "installment_payment"]
            },
            {
                "category": "Home Loans",
                "name": "Home Loans",
                "description": "Mortgage loans for home purchases",
                "actions": ["loan_application", "property_valuation", "loan_disbursement", "mortgage_payment"]
            },
            {
                "category": "Auto Loans",
                "name": "Auto Loans",
                "description": "Vehicle financing with competitive rates",
                "actions": ["loan_application", "vehicle_inspection", "loan_disbursement", "auto_payment"]
            },
            {
                "category": "Investment",
                "name": "Investment Products",
                "description": "Mutual funds and investment products",
                "actions": ["investment_consultation", "investment_purchase", "portfolio_management", "dividend_collection"]
            },
            {
                "category": "Insurance",
                "name": "Insurance Services",
                "description": "Life and general insurance products",
                "actions": ["insurance_application", "premium_payment", "claim_filing", "policy_renewal"]
            }
        ],
        "rules": [
            {"action": "card_application", "rate": 15.0, "mode": "flat", "unit": "SOV", "notes": "15 SOV for credit card application", "min_amount": 0, "max_reward": 1500},
            {"action": "card_spend", "rate": 0.03, "mode": "per_amount", "unit": "per 10k VND", "notes": "0.03% SOV reward on credit card spending", "min_amount": 100000, "max_reward": 3000},
            {"action": "loan_application", "rate": 20.0, "mode": "flat", "unit": "SOV", "notes": "20 SOV for loan application", "min_amount": 0, "max_reward": 2000},
            {"action": "installment_payment", "rate": 0.05, "mode": "per_amount", "unit": "per 10k VND", "notes": "0.05% SOV reward on installment payments", "min_amount": 200000, "max_reward": 5000},
            {"action": "cash_advance", "rate": 0.1, "mode": "per_amount", "unit": "per 10k VND", "notes": "0.1% SOV reward on cash advances", "min_amount": 100000, "max_reward": 1000},
            {"action": "investment_purchase", "rate": 0.08, "mode": "per_amount", "unit": "per 10k VND", "notes": "0.08% SOV reward on investment purchases", "min_amount": 1000000, "max_reward": 8000}
        ],
    },
    {
        "name": "Sovico Group",
        "description": "Diversified conglomerate with interests in aviation, real estate, finance, and technology",
        "sector": "Conglomerate",
        "website": "https://sovico.com.vn",
        "phone": "+84 28 7300 1888",
        "email": "info@sovico.com.vn",
        "address": "Sovico Tower, 1 Le Duan, District 1, Ho Chi Minh City",
        "business_license": "BL-005678901",
        "tax_code": "0105678901",
        "tier": "enterprise",
        "services": [
            {
                "category": "Corporate Services",
                "name": "Corporate Banking",
                "description": "Comprehensive banking services for corporations",
                "actions": ["corporate_account", "trade_finance", "cash_management", "corporate_loans"]
            },
            {
                "category": "Corporate Services",
                "name": "Investment Banking",
                "description": "M&A, IPOs, and capital market services",
                "actions": ["ipo_services", "merger_advisory", "capital_raising", "financial_advisory"]
            },
            {
                "category": "Technology",
                "name": "Digital Solutions",
                "description": "Digital transformation and technology services",
                "actions": ["digital_consultation", "system_integration", "cloud_services", "tech_support"]
            },
            {
                "category": "Logistics",
                "name": "Supply Chain",
                "description": "End-to-end supply chain management",
                "actions": ["logistics_planning", "warehouse_management", "transportation", "inventory_management"]
            },
            {
                "category": "Energy",
                "name": "Renewable Energy",
                "description": "Solar and wind energy projects",
                "actions": ["energy_consultation", "project_development", "energy_trading", "maintenance_service"]
            },
            {
                "category": "Hospitality",
                "name": "Hotel Management",
                "description": "Luxury hotel and resort management",
                "actions": ["hotel_booking", "conference_services", "catering", "guest_services"]
            }
        ],
        "rules": [
            {"action": "corporate_account", "rate": 100.0, "mode": "flat", "unit": "SOV", "notes": "100 SOV for corporate account opening", "min_amount": 0, "max_reward": 10000},
            {"action": "trade_finance", "rate": 0.02, "mode": "per_amount", "unit": "per 10k VND", "notes": "0.02% SOV reward on trade finance transactions", "min_amount": 10000000, "max_reward": 20000},
            {"action": "digital_consultation", "rate": 25.0, "mode": "flat", "unit": "SOV", "notes": "25 SOV for digital consultation", "min_amount": 0, "max_reward": 2500},
            {"action": "logistics_planning", "rate": 15.0, "mode": "flat", "unit": "SOV", "notes": "15 SOV for logistics planning", "min_amount": 0, "max_reward": 1500},
            {"action": "energy_consultation", "rate": 30.0, "mode": "flat", "unit": "SOV", "notes": "30 SOV for energy consultation", "min_amount": 0, "max_reward": 3000},
            {"action": "hotel_booking", "rate": 0.1, "mode": "per_amount", "unit": "per 10k VND", "notes": "0.1% SOV reward on hotel bookings", "min_amount": 500000, "max_reward": 1000}
        ],
    },
]


CUSTOMER_DATA: List[Dict[str, Any]] = [
    {"name": "Nguyễn Văn An", "email": "nguyen.van.an@email.com", "phone": "+84901234567", "segment": "premium"},
    {"name": "Trần Thị Bình", "email": "tran.thi.binh@email.com", "phone": "+84901234568", "segment": "standard"},
    {"name": "Lê Hoàng Cường", "email": "le.hoang.cuong@email.com", "phone": "+84901234569", "segment": "premium"},
    {"name": "Phạm Thị Dung", "email": "pham.thi.dung@email.com", "phone": "+84901234570", "segment": "standard"},
    {"name": "Hoàng Văn Em", "email": "hoang.van.em@email.com", "phone": "+84901234571", "segment": "premium"},
    {"name": "Vũ Thị Phương", "email": "vu.thi.phuong@email.com", "phone": "+84901234572", "segment": "standard"},
    {"name": "Đặng Minh Giang", "email": "dang.minh.giang@email.com", "phone": "+84901234573", "segment": "premium"},
    {"name": "Bùi Thị Hoa", "email": "bui.thi.hoa@email.com", "phone": "+84901234574", "segment": "standard"},
    {"name": "Ngô Văn Ích", "email": "ngo.van.ich@email.com", "phone": "+84901234575", "segment": "premium"},
    {"name": "Đinh Thị Kim", "email": "dinh.thi.kim@email.com", "phone": "+84901234576", "segment": "standard"},
    {"name": "Lý Hoàng Long", "email": "ly.hoang.long@email.com", "phone": "+84901234577", "segment": "premium"},
    {"name": "Phan Thị Mai", "email": "phan.thi.mai@email.com", "phone": "+84901234578", "segment": "standard"},
    {"name": "Võ Văn Nam", "email": "vo.van.nam@email.com", "phone": "+84901234579", "segment": "premium"},
    {"name": "Tôn Thị Oanh", "email": "ton.thi.oanh@email.com", "phone": "+84901234580", "segment": "standard"},
    {"name": "Cao Hoàng Phúc", "email": "cao.hoang.phuc@email.com", "phone": "+84901234581", "segment": "premium"},
    {"name": "Lưu Thị Quỳnh", "email": "luu.thi.quynh@email.com", "phone": "+84901234582", "segment": "standard"},
    {"name": "Trịnh Văn Rồng", "email": "trinh.van.rong@email.com", "phone": "+84901234583", "segment": "premium"},
    {"name": "Đỗ Thị Sương", "email": "do.thi.suong@email.com", "phone": "+84901234584", "segment": "standard"},
    {"name": "Hồ Văn Tùng", "email": "ho.van.tung@email.com", "phone": "+84901234585", "segment": "premium"},
    {"name": "Nguyễn Thị Uyên", "email": "nguyen.thi.uyen@email.com", "phone": "+84901234586", "segment": "standard"},
]


def generate_wallet_address() -> str:
    return f"hd_{secrets.token_hex(12)}"


def generate_tx_hash() -> str:
    return f"0x{secrets.token_hex(32)}"


def random_date_in_range(days_ago: int = 30) -> datetime:
    return datetime.utcnow() - timedelta(days=random.randint(0, days_ago))


def build_interaction_meta(company: Dict[str, Any], user: Dict[str, Any] | None, rule: Dict[str, Any] | None, amount: float, extra: Dict[str, Any] | None = None) -> str:
    meta: Dict[str, Any] = {
        "company": {"name": company.get("name"), "sector": company.get("sector")},
        "amount_vnd": amount,
        "currency": "VND",
        "generated_at": datetime.utcnow().isoformat(),
    }
    if user:
        meta["user"] = {k: user.get(k) for k in ["name", "email", "phone", "segment"]}
    if rule:
        meta["rule"] = {k: rule.get(k) for k in ["action", "mode", "rate", "unit", "notes"]}
    if extra:
        meta.update(extra)
    # store as a compact JSON-like string to keep schema as str
    try:
        import json
        return json.dumps(meta, ensure_ascii=False)
    except Exception:
        return str(meta)


def build_transfer_memo(kind: str, details: Dict[str, Any]) -> str:
    payload = {"kind": kind, **details}
    try:
        import json
        return json.dumps(payload, ensure_ascii=False)
    except Exception:
        return str(payload)


