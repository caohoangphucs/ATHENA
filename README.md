# ATHENA - AI-Powered Reward Ecosystem
# https://athena-hd-hackathon-ivf3.vercel.app/
# https://github.com/TaiLoiZzzz/ATHENA-HD_HACKATHON




ATHENA is a comprehensive reward system that enables companies to create and manage token-based reward programs using blockchain technology. The platform provides APIs for companies to integrate reward mechanisms into their services and allows users to earn and manage SOV tokens.

## 🚀 Features

### Backend (FastAPI + SQLModel)
- **Company Management**: Signup, profile management, service configuration
- **User Management**: User registration, wallet creation, transaction history
- **Reward Engine**: Configurable reward rules and smart contracts
- **Mock Blockchain**: In-memory SOV token management
- **Analytics**: Detailed transaction tracking with enhanced data fields
- **API Documentation**: Auto-generated OpenAPI/Swagger docs

### Frontend (Next.js 14 + TailwindCSS)
- **Landing Page**: Company onboarding and API key management
- **Company Dashboard**: Guided onboarding flow with services configuration
- **Network Visualization**: Real-time animated network of companies and users
- **Interactive UI**: Modern, responsive design with animations

## 🏗️ Architecture

```
ATHENA/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── models.py       # SQLModel database models
│   │   ├── schemas.py      # Pydantic request/response schemas
│   │   ├── routers/        # API endpoint modules
│   │   ├── services.py     # Business logic
│   │   ├── blockchain.py   # Mock blockchain implementation
│   │   └── mock_data.py    # Sample data generation
│   ├── main.py            # FastAPI application entry point
│   └── requirements.txt   # Python dependencies
├── frontend/               # Next.js frontend
│   ├── app/               # App Router pages
│   ├── components/        # Reusable UI components
│   ├── lib/              # API client and utilities
│   └── package.json      # Node.js dependencies
└── docs/                 # Additional documentation
```

## 🛠️ Quick Start

### Prerequisites
- Python 3.12+
- Node.js 18+
- Git

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 3000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Access Points
- **Backend API**: http://localhost:3000
- **API Docs**: http://localhost:3000/docs
- **Frontend**: http://localhost:3001
- **Network View**: http://localhost:3001/network

## 📊 Database Schema

### Core Models
- **Company**: Business entities with services and reward rules
- **User**: End users who earn and spend tokens
- **Wallet**: Token storage for companies and users
- **Interaction**: User actions that trigger rewards
- **TokenTransfer**: Blockchain transactions
- **RewardRule**: Configurable reward logic
- **SmartContract**: API-triggered reward contracts

### Enhanced Analytics Fields
- Transaction types, status, location, device
- Payment methods, currency, exchange rates
- Risk scoring, fraud detection
- Discounts, taxes, commissions

## 🔌 API Integration

### Authentication
All API calls require `X-API-Key` header with company API key.

### Key Endpoints
- `POST /companies/signup` - Company registration
- `GET /companies/profile` - Company details
- `PUT /companies/profile` - Update company services
- `POST /contracts` - Create reward contracts
- `POST /contracts/{id}/events` - Trigger rewards
- `GET /dev/users/{id}/transactions` - User transaction history

### Example Integration
```bash
# Create company
curl -X POST http://localhost:3000/companies/signup \
  -H "Content-Type: application/json" \
  -d '{"name": "My Company", "sector": "Banking"}'

# Create reward contract
curl -X POST http://localhost:3000/contracts \
  -H "X-API-Key: sk_..." \
  -H "Content-Type: application/json" \
  -d '{"name": "Purchase Rewards", "action": "purchase", "mode": "per_amount", "rate": 2.0}'

# Trigger reward
curl -X POST http://localhost:3000/contracts/1/events \
  -H "X-API-Key: sk_..." \
  -H "X-Contract-Secret: secret..." \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1, "amount": 100000, "meta": {"product": "laptop"}}'
```

## 🎯 Use Cases

### For Companies
1. **Banking**: Reward deposits, card spending, loan repayments
2. **Aviation**: Flight bookings, check-ins, loyalty programs
3. **Real Estate**: Property purchases, rental payments, maintenance
4. **Finance**: Credit applications, investment purchases, insurance
5. **E-commerce**: Product purchases, referrals, reviews

### For Users
- Earn SOV tokens through various activities
- Track transaction history and rewards
- View network of participating companies
- Manage token balances and transfers

## 🔧 Development

### Backend Development
```bash
cd backend
# Install dependencies
pip install -r requirements.txt

# Run with auto-reload
uvicorn main:app --reload --port 3000

# Run tests (if available)
pytest

# Generate mock data
curl -X POST http://localhost:3000/dev/seed_sovico
```

### Frontend Development
```bash
cd frontend
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
npm start
```

### Database Management
```bash
# Reset all data
curl -X POST http://localhost:3000/dev/reset

# Migrate schema (adds new columns)
curl -X POST http://localhost:3000/dev/migrate

# Generate comprehensive test data
curl -X POST http://localhost:3000/dev/seed_sovico
```

## 📈 Analytics & Monitoring

### Transaction Analytics
- Real-time transaction tracking
- Risk scoring and fraud detection
- Payment method analysis
- Geographic and device insights
- Revenue and commission tracking

### Network Visualization
- Interactive company and user network
- Real-time token transfer animations
- Transaction flow visualization
- Performance metrics dashboard

## 🚀 Deployment

### Backend Deployment
```bash
# Production server
uvicorn main:app --host 0.0.0.0 --port 3000

# With Gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
```

### Frontend Deployment
```bash
# Build and serve
npm run build
npm start

# Or deploy to Vercel/Netlify
vercel deploy
```

### Environment Variables
```bash
# Backend
NEXT_PUBLIC_API_BASE=http://localhost:3000

# Frontend
NEXT_PUBLIC_API_BASE=https://api.athena.com
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the API documentation at `/docs`
- Review the network visualization at `/network`

## 🔮 Roadmap

- [ ] Real blockchain integration (Ethereum/Polygon)
- [ ] Advanced analytics dashboard
- [ ] Mobile app for end users
- [ ] Multi-currency support
- [ ] Advanced fraud detection
- [ ] API rate limiting and monitoring
- [ ] Webhook notifications
- [ ] Third-party integrations

---

**ATHENA** - Empowering businesses with intelligent reward systems through AI and blockchain technology.
