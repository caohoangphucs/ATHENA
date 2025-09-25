## ATHENA Frontend (Next.js + Tailwind)

### Run
```bash
cd frontend
npm install
# backend runs at http://localhost:3000
# frontend runs at http://localhost:3001

# set API base (optional if using default http://localhost:3000)
echo "NEXT_PUBLIC_API_BASE=http://localhost:3000" > .env.local

npm run dev
# open http://localhost:3001
```

### Notes
- Backend base URL: `NEXT_PUBLIC_API_BASE` (default `http://localhost:3000`).
- Use the Company API Key in UI fields to call protected endpoints.
