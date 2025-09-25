from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db import create_db_and_tables
from app.routers import companies, users, interactions, rules, wallets, dev, contracts

app = FastAPI(title="ATHENA MVP Backend", version="0.1.0")

# CORS (allow all for demo)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    create_db_and_tables()


# Routers
app.include_router(companies.router, prefix="/companies", tags=["companies"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(interactions.router, prefix="/interactions", tags=["interactions"])
app.include_router(rules.router, prefix="/rules", tags=["rules"])
app.include_router(wallets.router, prefix="/wallets", tags=["wallets"])
app.include_router(contracts.router, prefix="/contracts", tags=["contracts"])  # new
app.include_router(dev.router, prefix="/dev", tags=["dev"])  # optional
