from __future__ import annotations

import secrets
from typing import Dict


class MockChain:
    def __init__(self) -> None:
        self.balances: Dict[str, float] = {}

    def ensure(self, addr: str) -> None:
        if addr not in self.balances:
            self.balances[addr] = 0.0

    def mint(self, to_addr: str, amount: float) -> str:
        self.ensure(to_addr)
        self.balances[to_addr] += amount
        return secrets.token_hex(16)

    def transfer(self, from_addr: str, to_addr: str, amount: float) -> str:
        self.ensure(from_addr)
        self.ensure(to_addr)
        if self.balances[from_addr] < amount:
            raise ValueError("insufficient balance")
        self.balances[from_addr] -= amount
        self.balances[to_addr] += amount
        return secrets.token_hex(16)

    def balance_of(self, addr: str) -> float:
        self.ensure(addr)
        return self.balances[addr]

    def reset(self) -> None:
        """Reset all balances to empty state"""
        self.balances.clear()


CHAIN = MockChain()
