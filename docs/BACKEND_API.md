# ATHENA Backend API Documentation

## Overview

The ATHENA backend provides a comprehensive REST API for managing companies, users, rewards, and blockchain transactions. Built with FastAPI and SQLModel, it offers automatic API documentation and type safety.

## Base URL
```
http://localhost:3000
```

## Authentication

All API endpoints (except public ones) require authentication via API key:

```http
X-API-Key: sk_your_api_key_here
```

## API Endpoints

### Company Management

#### POST /companies/signup
Register a new company and receive API key.

**Request Body:**
```json
{
  "name": "string",
  "description": "string (optional)",
  "sector": "string (optional)",
  "website": "string (optional)",
  "phone": "string (optional)",
  "email": "string (optional)",
  "address": "string (optional)",
  "business_license": "string (optional)",
  "tax_code": "string (optional)",
  "supported_actions": ["string"] (optional),
  "service_categories": ["string"] (optional),
  "tier": "string (optional, default: 'basic')"
}
```

**Response:**
```json
{
  "company_id": 1,
  "api_key": "sk_..."
}
```

#### GET /companies/profile
Get company profile information.

**Headers:** `X-API-Key`

**Response:**
```json
{
  "id": 1,
  "name": "string",
  "description": "string",
  "sector": "string",
  "website": "string",
  "phone": "string",
  "email": "string",
  "address": "string",
  "business_license": "string",
  "tax_code": "string",
  "supported_actions": ["string"],
  "service_categories": ["string"],
  "is_active": true,
  "tier": "string",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

#### PUT /companies/profile
Update company profile and services.

**Headers:** `X-API-Key`

**Request Body:** Same as signup (all fields optional)

**Response:** Updated company profile

#### GET /companies/wallets/master
Get company's master wallet information.

**Headers:** `X-API-Key`

**Response:**
```json
{
  "address": "hd_...",
  "balance": 1000000.0
}
```

#### GET /companies/services
Get company's services and reward rules.

**Headers:** `X-API-Key`

**Response:**
```json
{
  "company_id": 1,
  "company_name": "string",
  "supported_actions": ["string"],
  "services": [
    {
      "source": "rule|contract",
      "action": "string",
      "mode": "per_amount|flat",
      "rate": 2.0,
      "is_active": true,
      "unit": "string",
      "notes": "string",
      "min_amount": 100000,
      "max_reward": 1000
    }
  ]
}
```

#### DELETE /companies/{company_id}
Delete company and all associated data.

**Headers:** `X-API-Key`

**Response:**
```json
{
  "message": "Company 'Name' and all associated data deleted successfully"
}
```

### User Management

#### POST /users
Create a new user for a company.

**Headers:** `X-API-Key`

**Request Body:**
```json
{
  "full_name": "string",
  "email": "string",
  "phone": "string (optional)",
  "segment": "string (optional)"
}
```

**Response:**
```json
{
  "id": 1,
  "full_name": "string",
  "email": "string",
  "phone": "string",
  "segment": "string",
  "company_id": 1,
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### GET /users
List users for the authenticated company.

**Headers:** `X-API-Key`

**Response:**
```json
[
  {
    "id": 1,
    "full_name": "string",
    "email": "string",
    "phone": "string",
    "segment": "string",
    "company_id": 1,
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

#### GET /users/{user_id}
Get specific user details.

**Headers:** `X-API-Key`

**Response:** User object

#### PUT /users/{user_id}
Update user information.

**Headers:** `X-API-Key`

**Request Body:** User fields (all optional)

**Response:** Updated user object

#### DELETE /users/{user_id}
Delete user and associated data.

**Headers:** `X-API-Key`

**Response:**
```json
{
  "message": "User deleted successfully"
}
```

### Wallet Management

#### GET /wallets
List wallets for the authenticated company.

**Headers:** `X-API-Key`

**Response:**
```json
[
  {
    "id": 1,
    "owner_type": "company|user",
    "owner_id": 1,
    "address": "hd_...",
    "balance": 1000000.0
  }
]
```

#### GET /wallets/{wallet_id}
Get specific wallet details.

**Headers:** `X-API-Key`

**Response:** Wallet object

#### POST /wallets/transfer
Transfer tokens between wallets.

**Headers:** `X-API-Key`

**Request Body:**
```json
{
  "from_wallet": "hd_...",
  "to_wallet": "hd_...",
  "amount": 100.0,
  "memo": "string (optional)"
}
```

**Response:**
```json
{
  "tx_hash": "0x...",
  "amount": 100.0,
  "from_wallet": "hd_...",
  "to_wallet": "hd_..."
}
```

### Interaction Management

#### POST /interactions
Record a user interaction.

**Headers:** `X-API-Key`

**Request Body:**
```json
{
  "user_id": 1,
  "service": "string",
  "action": "string",
  "amount": 100000.0,
  "meta": "string (optional)"
}
```

**Response:**
```json
{
  "id": 1,
  "user_id": 1,
  "company_id": 1,
  "service": "string",
  "action": "string",
  "amount": 100000.0,
  "meta": "string",
  "transaction_type": "reward|payment|refund|bonus",
  "status": "completed|pending|failed|cancelled",
  "location": "online|mobile|branch|atm",
  "device_type": "mobile|desktop|tablet|pos",
  "payment_method": "card|cash|transfer|qr",
  "currency": "VND|USD|EUR",
  "exchange_rate": 1.0,
  "discount_applied": 0.0,
  "tax_amount": 0.0,
  "commission_rate": 0.02,
  "risk_score": 0.5,
  "fraud_detected": false,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

#### GET /interactions
List interactions for the authenticated company.

**Headers:** `X-API-Key`

**Query Parameters:**
- `user_id` (optional): Filter by user
- `action` (optional): Filter by action
- `limit` (optional): Limit results (default: 50)

**Response:** Array of interaction objects

### Reward Rules

#### POST /rules
Create a new reward rule.

**Headers:** `X-API-Key`

**Request Body:**
```json
{
  "action": "string",
  "rate": 2.0,
  "mode": "per_amount|flat",
  "is_active": true
}
```

**Response:**
```json
{
  "id": 1,
  "action": "string",
  "rate": 2.0,
  "mode": "per_amount|flat",
  "is_active": true,
  "company_id": 1,
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### GET /rules
List reward rules for the authenticated company.

**Headers:** `X-API-Key`

**Response:** Array of rule objects

#### PUT /rules/{rule_id}
Update a reward rule.

**Headers:** `X-API-Key`

**Request Body:** Rule fields (all optional)

**Response:** Updated rule object

#### DELETE /rules/{rule_id}
Delete a reward rule.

**Headers:** `X-API-Key`

**Response:**
```json
{
  "message": "Reward rule deleted successfully"
}
```

### Smart Contracts

#### POST /contracts
Create a new smart contract.

**Headers:** `X-API-Key`

**Request Body:**
```json
{
  "name": "string",
  "action": "string",
  "mode": "per_amount|flat",
  "rate": 2.0
}
```

**Response:**
```json
{
  "id": 1,
  "name": "string",
  "action": "string",
  "mode": "per_amount|flat",
  "rate": 2.0,
  "is_active": true
}
```

#### GET /contracts
List smart contracts for the authenticated company.

**Headers:** `X-API-Key`

**Response:** Array of contract objects

#### POST /contracts/{contract_id}/events
Trigger a contract event (fire reward).

**Headers:** 
- `X-API-Key`
- `X-Contract-Secret`

**Request Body:**
```json
{
  "user_id": 1,
  "amount": 100000.0,
  "meta": "string (optional)"
}
```

**Response:**
```json
{
  "id": 1,
  "user_id": 1,
  "company_id": 1,
  "service": "string",
  "action": "string",
  "amount": 100000.0,
  "reward_tokens": 20.0,
  "meta": "string",
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### POST /contracts/{contract_id}/toggle
Toggle contract active status.

**Headers:** `X-API-Key`

**Request Body:**
```json
{
  "enable": true
}
```

**Response:**
```json
{
  "id": 1,
  "is_active": true
}
```

### Development Endpoints

#### GET /dev/companies
List all companies (development only).

**Response:** Array of company objects

#### GET /dev/wallets
List all wallets (development only).

**Response:** Array of wallet objects

#### GET /dev/transfers
List all token transfers (development only).

**Query Parameters:**
- `limit` (optional): Limit results (default: 50)

**Response:** Array of transfer objects

#### GET /dev/users/{user_id}/transactions
Get detailed transaction history for a user.

**Response:**
```json
{
  "user_id": 1,
  "interactions": [
    {
      "id": 1,
      "company_name": "string",
      "service": "string",
      "action": "string",
      "amount": 100000.0,
      "transaction_type": "reward|payment",
      "status": "completed",
      "location": "online",
      "device_type": "mobile",
      "payment_method": "card",
      "currency": "VND",
      "discount_applied": 0.0,
      "tax_amount": 0.0,
      "risk_score": 0.5,
      "fraud_detected": false,
      "created_at": "2024-01-01T00:00:00Z",
      "meta": "string"
    }
  ],
  "transfers": [
    {
      "id": 1,
      "tx_hash": "0x...",
      "from_wallet": "hd_...",
      "to_wallet": "hd_...",
      "amount": 20.0,
      "memo": "string",
      "created_at": "2024-01-01T00:00:00Z",
      "direction": "incoming|outgoing"
    }
  ]
}
```

#### POST /dev/demo/purchase
Simulate a demo purchase (development only).

**Query Parameters:**
- `company_id`: Company ID
- `amount` (optional): Purchase amount (default: 200000)

**Response:**
```json
{
  "interaction_id": 1,
  "user_id": 1,
  "reward": 20.0
}
```

#### POST /dev/user_purchase
Simulate a user purchase (development only).

**Query Parameters:**
- `company_id`: Company ID
- `user_id`: User ID
- `amount` (optional): Purchase amount (default: 200000)

**Response:**
```json
{
  "interaction_id": 1,
  "user_id": 1,
  "company_wallet": "hd_...",
  "user_wallet": "hd_...",
  "reward": 20.0,
  "tx_hash": "0x..."
}
```

#### POST /dev/seed_sovico
Generate comprehensive Sovico ecosystem mock data.

**Response:**
```json
{
  "message": "Sovico data generated successfully",
  "companies_created": 5,
  "users_created": 20,
  "transactions_created": 200
}
```

#### POST /dev/reset
Reset all data (development only).

**Response:**
```json
{
  "message": "All data reset successfully"
}
```

#### POST /dev/migrate
Migrate database schema (development only).

**Response:**
```json
{
  "message": "Migration completed",
  "added_columns": {
    "company": ["description", "sector", "website"],
    "interaction": ["transaction_type", "status", "location"]
  }
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "detail": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "detail": "Invalid API key"
}
```

### 403 Forbidden
```json
{
  "detail": "Access denied"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

## Rate Limiting

Currently no rate limiting is implemented. In production, consider implementing rate limiting based on API key.

## CORS

CORS is enabled for all origins in development. In production, configure CORS to allow only your frontend domain.

## WebSocket Support

WebSocket support is not currently implemented but can be added for real-time updates.

## API Versioning

API versioning is not currently implemented. All endpoints are under the root path. Consider implementing versioning for future releases.

## Testing

Use the interactive API documentation at `/docs` to test endpoints directly in your browser.

## SDKs

Official SDKs are not currently available, but the API is designed to be easily consumable by any HTTP client.
