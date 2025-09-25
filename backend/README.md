## ATHENA MVP Backend

FastAPI + SQLModel (SQLite) with an in-memory mock blockchain for SOV token.

### Quickstart

```bash
# 1) Create venv (optional)
python -m venv .venv && source .venv/bin/activate

# 2) Install deps
pip install -r backend/requirements.txt

# 3) Run dev server
uvicorn backend.main:app --reload
```

### Demo Flow
- Company signs up and gets an API key, which also creates a master wallet funded with demo SOV.
- Company registers users; each user gets a wallet.
- Services post user interactions (e.g., purchase) with metadata.
- Reward engine applies simple rules and transfers SOV from the company master wallet to the user wallet.

### Seed (optional)
```bash
# Returns demo api_key, company_id, user_id
curl -X POST http://localhost:8000/dev/seed
```

Replace the mock chain with a real chain adapter later (e.g., Hyperledger/EVM). Replace API key auth with OAuth/JWT for production.
