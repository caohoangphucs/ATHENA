# ATHENA Database Schema Documentation

## Overview

The ATHENA database uses SQLite with SQLModel for ORM functionality. The schema supports a comprehensive reward ecosystem with companies, users, transactions, and analytics.

## Database Technology

- **Database**: SQLite (file-based)
- **ORM**: SQLModel (SQLAlchemy + Pydantic)
- **Migrations**: Custom migration system
- **Backup**: File-based (copy `athena.db`)

## Core Tables

### Company Table

**Purpose**: Store company information and service details

```sql
CREATE TABLE company (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    api_key TEXT NOT NULL UNIQUE,
    
    -- Service Details
    description TEXT,
    sector TEXT,
    website TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    
    -- Business Details
    business_license TEXT,
    tax_code TEXT,
    
    -- Service Capabilities
    supported_actions TEXT,  -- JSON string
    service_categories TEXT, -- JSON string
    
    -- Status and Metadata
    is_active BOOLEAN DEFAULT TRUE,
    tier TEXT DEFAULT 'basic',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME
);
```

**Key Fields**:
- `api_key`: Unique authentication key
- `supported_actions`: JSON array of supported actions
- `service_categories`: JSON array of service categories
- `tier`: Company tier (basic, premium, enterprise)

**Indexes**:
- `api_key` (unique)
- `is_active`
- `tier`

### User Table

**Purpose**: Store end-user information

```sql
CREATE TABLE user (
    id INTEGER PRIMARY KEY,
    company_id INTEGER NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    segment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (company_id) REFERENCES company (id)
);
```

**Key Fields**:
- `company_id`: Foreign key to company
- `segment`: User segment (premium, standard, demo)
- `email`: Unique identifier per company

**Indexes**:
- `company_id`
- `email`
- `segment`

### Wallet Table

**Purpose**: Store wallet addresses and balances

```sql
CREATE TABLE wallet (
    id INTEGER PRIMARY KEY,
    owner_type TEXT NOT NULL,  -- 'company' or 'user'
    owner_id INTEGER NOT NULL,
    address TEXT NOT NULL UNIQUE,
    
    FOREIGN KEY (owner_id) REFERENCES company (id) OR user (id)
);
```

**Key Fields**:
- `owner_type`: Type of owner (company/user)
- `owner_id`: ID of the owner
- `address`: Unique wallet address

**Indexes**:
- `address` (unique)
- `owner_type`
- `owner_id`

### Interaction Table

**Purpose**: Store user interactions with enhanced analytics

```sql
CREATE TABLE interaction (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    company_id INTEGER NOT NULL,
    service TEXT NOT NULL,
    action TEXT NOT NULL,
    amount REAL,
    meta TEXT,  -- JSON string
    
    -- Enhanced Analytics Fields
    transaction_type TEXT,      -- 'reward', 'payment', 'refund', 'bonus'
    status TEXT,                -- 'completed', 'pending', 'failed', 'cancelled'
    location TEXT,              -- 'online', 'mobile', 'branch', 'atm'
    device_type TEXT,           -- 'mobile', 'desktop', 'tablet', 'pos'
    payment_method TEXT,        -- 'card', 'cash', 'transfer', 'qr'
    currency TEXT,              -- 'VND', 'USD', 'EUR'
    exchange_rate REAL,         -- For currency conversion
    discount_applied REAL,      -- Discount amount
    tax_amount REAL,            -- Tax applied
    commission_rate REAL,       -- Commission percentage
    risk_score REAL,            -- Risk assessment score
    fraud_detected BOOLEAN,     -- Fraud detection flag
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    
    FOREIGN KEY (user_id) REFERENCES user (id),
    FOREIGN KEY (company_id) REFERENCES company (id)
);
```

**Key Fields**:
- `transaction_type`: Type of transaction
- `status`: Transaction status
- `location`: Where transaction occurred
- `device_type`: Device used
- `payment_method`: Payment method
- `risk_score`: Risk assessment (0-1)
- `fraud_detected`: Fraud flag

**Indexes**:
- `user_id`
- `company_id`
- `action`
- `transaction_type`
- `status`
- `created_at`

### TokenTransfer Table

**Purpose**: Store blockchain transactions

```sql
CREATE TABLE tokentransfer (
    id INTEGER PRIMARY KEY,
    tx_hash TEXT NOT NULL UNIQUE,
    from_wallet TEXT,
    to_wallet TEXT,
    amount REAL NOT NULL,
    memo TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (from_wallet) REFERENCES wallet (address),
    FOREIGN KEY (to_wallet) REFERENCES wallet (address)
);
```

**Key Fields**:
- `tx_hash`: Unique transaction hash
- `from_wallet`: Source wallet address
- `to_wallet`: Destination wallet address
- `amount`: Transfer amount in SOV tokens
- `memo`: Transaction memo (JSON string)

**Indexes**:
- `tx_hash` (unique)
- `from_wallet`
- `to_wallet`
- `created_at`

### RewardRule Table

**Purpose**: Store configurable reward rules

```sql
CREATE TABLE rewardrule (
    id INTEGER PRIMARY KEY,
    company_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    rate REAL NOT NULL,
    mode TEXT NOT NULL,  -- 'per_amount' or 'flat'
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (company_id) REFERENCES company (id)
);
```

**Key Fields**:
- `action`: Action that triggers reward
- `rate`: Reward rate
- `mode`: Calculation mode (per_amount/flat)
- `is_active`: Rule status

**Indexes**:
- `company_id`
- `action`
- `is_active`

### SmartContract Table

**Purpose**: Store smart contract configurations

```sql
CREATE TABLE smartcontract (
    id INTEGER PRIMARY KEY,
    company_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    action TEXT NOT NULL,
    mode TEXT NOT NULL,
    rate REAL NOT NULL,
    secret TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (company_id) REFERENCES company (id)
);
```

**Key Fields**:
- `name`: Contract name
- `action`: Action that triggers reward
- `rate`: Reward rate
- `mode`: Calculation mode
- `secret`: Contract secret for authentication
- `is_active`: Contract status

**Indexes**:
- `company_id`
- `is_active`
- `secret`

## Data Types

### JSON Fields
Several fields store JSON data as TEXT:

- `company.supported_actions`: Array of supported actions
- `company.service_categories`: Array of service categories
- `interaction.meta`: Detailed interaction metadata
- `tokentransfer.memo`: Transfer memo with details

### Example JSON Structures

**supported_actions**:
```json
["purchase", "booking", "referral", "deposit", "withdrawal"]
```

**service_categories**:
```json
["banking", "aviation", "real_estate", "finance", "ecommerce"]
```

**interaction.meta**:
```json
{
  "company": {"name": "HDBank", "sector": "Banking"},
  "user": {"name": "John Doe", "email": "john@example.com"},
  "rule": {"action": "purchase", "rate": 2.0, "mode": "per_amount"},
  "amount_vnd": 100000,
  "currency": "VND",
  "generated_at": "2024-01-01T00:00:00Z"
}
```

**tokentransfer.memo**:
```json
{
  "kind": "reward",
  "direction": "company_to_user",
  "interaction_id": 123,
  "rule_id": 456
}
```

## Relationships

### Foreign Key Relationships

1. **User → Company**: Many-to-One
   - `user.company_id` → `company.id`

2. **Wallet → Owner**: Polymorphic
   - `wallet.owner_id` + `wallet.owner_type` → `company.id` or `user.id`

3. **Interaction → User**: Many-to-One
   - `interaction.user_id` → `user.id`

4. **Interaction → Company**: Many-to-One
   - `interaction.company_id` → `company.id`

5. **RewardRule → Company**: Many-to-One
   - `rewardrule.company_id` → `company.id`

6. **SmartContract → Company**: Many-to-One
   - `smartcontract.company_id` → `company.id`

7. **TokenTransfer → Wallet**: Many-to-One (both directions)
   - `tokentransfer.from_wallet` → `wallet.address`
   - `tokentransfer.to_wallet` → `wallet.address`

## Indexes

### Primary Indexes
- All tables have `id` as PRIMARY KEY

### Unique Indexes
- `company.api_key`
- `wallet.address`
- `tokentransfer.tx_hash`

### Performance Indexes
- `user.company_id`
- `wallet.owner_type`
- `wallet.owner_id`
- `interaction.user_id`
- `interaction.company_id`
- `interaction.action`
- `interaction.created_at`
- `rewardrule.company_id`
- `smartcontract.company_id`

## Data Integrity

### Constraints
- **NOT NULL**: Required fields are marked NOT NULL
- **UNIQUE**: Unique fields have UNIQUE constraints
- **FOREIGN KEY**: All foreign keys have proper constraints
- **CHECK**: Some fields have implicit constraints (e.g., positive amounts)

### Validation
- **API Key Format**: Must start with 'sk_'
- **Email Format**: Valid email addresses
- **Amount Validation**: Positive numbers
- **Rate Validation**: Non-negative rates
- **JSON Validation**: Valid JSON in TEXT fields

## Migration System

### Migration Endpoints
- `POST /dev/migrate`: Add missing columns
- Automatic migration on seed/reset operations

### Migration Process
1. Check existing columns
2. Add missing columns with appropriate types
3. Set default values where needed
4. Update indexes if necessary

### Example Migration
```sql
-- Add new columns to interaction table
ALTER TABLE interaction ADD COLUMN transaction_type TEXT;
ALTER TABLE interaction ADD COLUMN status TEXT;
ALTER TABLE interaction ADD COLUMN location TEXT;
-- ... more columns
```

## Backup and Recovery

### Backup Strategy
1. **File-based**: Copy `athena.db` file
2. **SQL Export**: Export schema and data
3. **Incremental**: Track changes via timestamps

### Recovery Process
1. Stop application
2. Replace `athena.db` with backup
3. Run migration if needed
4. Restart application

## Performance Considerations

### Query Optimization
- Use indexes for frequently queried fields
- Limit results with pagination
- Use appropriate WHERE clauses
- Avoid SELECT * in production

### Storage Optimization
- JSON fields are stored as TEXT (consider JSONB in PostgreSQL)
- Regular VACUUM operations
- Monitor database size

### Connection Management
- SQLite is file-based (no connection pooling needed)
- Single writer, multiple readers
- Consider WAL mode for better concurrency

## Security Considerations

### Data Protection
- API keys are stored in plain text (consider encryption)
- Sensitive data in JSON fields
- No password storage (API key based auth)

### Access Control
- Application-level access control
- No direct database access in production
- API key validation for all operations

## Monitoring and Maintenance

### Health Checks
- Database file exists and is readable
- Tables have expected structure
- Foreign key constraints are valid

### Maintenance Tasks
- Regular VACUUM operations
- Monitor database size
- Check for orphaned records
- Validate JSON fields

### Logging
- Database operations logged at application level
- Error tracking for failed queries
- Performance monitoring for slow queries

## Future Enhancements

### Planned Improvements
- **PostgreSQL Migration**: For better performance and features
- **JSONB Support**: Native JSON operations
- **Partitioning**: For large transaction tables
- **Replication**: For high availability
- **Encryption**: For sensitive data

### Schema Evolution
- Version tracking for migrations
- Backward compatibility
- Data transformation scripts
- Rollback procedures

## Troubleshooting

### Common Issues
1. **Foreign Key Violations**: Check data integrity
2. **JSON Parse Errors**: Validate JSON fields
3. **Migration Failures**: Check column existence
4. **Performance Issues**: Check indexes and queries

### Debug Tools
- SQLite command line tool
- Database browser applications
- Query performance analysis
- Schema inspection tools

### Recovery Procedures
1. **Data Corruption**: Restore from backup
2. **Migration Errors**: Rollback and retry
3. **Performance Issues**: Optimize queries and indexes
4. **Access Issues**: Check file permissions
