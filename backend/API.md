## ATHENA MVP Backend API

Base URL: http://localhost:8000

Auth: All protected endpoints require header:
- X-API-Key: <company_api_key>

OpenAPI/Swagger:
- Swagger UI: /docs
- ReDoc: /redoc
- OpenAPI JSON: /openapi.json

### Companies
- POST /companies/signup
  - body: { "name": "DemoCo" }
  - 201 -> { "company_id": 1, "api_key": "sk_..." }

- GET /companies/wallets/master
  - headers: X-API-Key
  - 200 -> { "address": "w_...", "balance": 1000000 }

### Users
- POST /users
  - headers: X-API-Key
  - body: { "full_name": "Alice", "email": "alice@example.com", "phone": "", "segment": "VIP" }
  - 201 -> UserOut (includes wallet)

- GET /users/{user_id}
  - headers: X-API-Key
  - 200 -> UserOut

- PUT /users/{user_id}
  - headers: X-API-Key
  - body: { "full_name": "Alice B", "phone": "0123", "segment": "VIP" }
  - 200 -> UserOut

### Interactions
- POST /interactions
  - headers: X-API-Key
  - body: { "user_id": 1, "service": "Vietjet", "action": "purchase", "amount": 500000, "meta": "" }
  - 201 -> { "id": 10, "reward_tokens": 100.0 }

- GET /interactions/users/{user_id}/history
  - headers: X-API-Key
  - 200 -> Interaction[]

### Reward Rules
- POST /rules
  - headers: X-API-Key
  - body: { "action": "purchase", "rate": 2.0, "mode": "per_amount" }
  - 201 -> RewardRule

- GET /rules
  - headers: X-API-Key
  - 200 -> RewardRule[]

### Wallets / Mock Chain
- GET /wallets/{owner_type}/{owner_id}
  - headers: X-API-Key
  - owner_type: company | user
  - 200 -> { "address": "w_...", "balance": 1234.0 }

- POST /wallets/mockchain/transfer
  - headers: X-API-Key
  - query/body params: from_owner_type, from_owner_id, to_owner_type, to_owner_id, amount
  - 200 -> { "tx_hash": "...", "amount": 10, "from_wallet": "...", "to_wallet": "..." }

### Contracts (Mock Smart Contracts)
- POST /contracts
  - headers: X-API-Key
  - body: { "name": "Vietjet Purchase", "action": "purchase", "mode": "per_amount", "rate": 2.0 }
  - 201 -> { "id": 1, "name": "...", "action": "purchase", "mode": "per_amount", "rate": 2.0, "is_active": true }

- GET /contracts
  - headers: X-API-Key
  - 200 -> ContractOut[]

- POST /contracts/{cid}/events
  - headers: X-API-Key, X-Contract-Secret
  - body: { "user_id": 1, "amount": 500000, "meta": "booking#123" }
  - 201 -> { "id": <interaction_id>, "reward_tokens": <float> }

- POST /contracts/{cid}/toggle?enable=true|false
  - headers: X-API-Key
  - 200 -> { "id": <cid>, "is_active": true|false }

### Dev Utilities (do not use in prod)
- POST /dev/seed
  - 200 -> { "api_key": "sk_demo_company", "company_id": 1, "user_id": 1 }

---

### cURL Examples

Create company and get API key:
```bash
curl -s -X POST http://localhost:8000/companies/signup \
  -H 'Content-Type: application/json' \
  -d '{"name":"DemoCo"}'
```

Create a rule:
```bash
curl -s -X POST 'http://localhost:8000/rules' \
  -H 'Content-Type: application/json' \
  -H 'X-API-Key: <API_KEY>' \
  -d '{"action":"purchase","rate":2.0,"mode":"per_amount"}'
```

Create user:
```bash
curl -s -X POST 'http://localhost:8000/users' \
  -H 'Content-Type: application/json' \
  -H 'X-API-Key: <API_KEY>' \
  -d '{"full_name":"Alice","email":"alice@example.com"}'
```

Record purchase interaction:
```bash
curl -s -X POST 'http://localhost:8000/interactions' \
  -H 'Content-Type: application/json' \
  -H 'X-API-Key: <API_KEY>' \
  -d '{"user_id":1,"service":"Vietjet","action":"purchase","amount":500000}'
```

Create contract and fire event:
```bash
# Create contract
curl -s -X POST 'http://localhost:8000/contracts' \
  -H 'Content-Type: application/json' \
  -H 'X-API-Key: <API_KEY>' \
  -d '{"name":"VJ Purchase","action":"purchase","mode":"per_amount","rate":2.0}'

# Then fire event (use returned contract id and secret from DB; if needed, inspect DB)
curl -s -X POST 'http://localhost:8000/contracts/1/events' \
  -H 'Content-Type: application/json' \
  -H 'X-API-Key: <API_KEY>' \
  -H 'X-Contract-Secret: <SECRET>' \
  -d '{"user_id":1, "amount":500000, "meta":"order#1"}'
```
