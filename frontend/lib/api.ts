const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

export async function api<T>(path: string, opts: RequestInit & { apiKey?: string } = {}): Promise<T> {
  const headers = new Headers(opts.headers);
  headers.set('Content-Type', 'application/json');
  if (opts.apiKey) headers.set('X-API-Key', opts.apiKey);
  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers, cache: 'no-store' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export type CompanySignupOut = { company_id: number; api_key: string };
export type WalletOut = { address: string; balance: number };
export type ContractOut = { id: number; name: string; action: string; mode: string; rate: number; is_active: boolean };

export type DevCompany = { id: number; name: string; api_key: string; created_at: string };
export type DevWallet = { id: number; owner_type: 'company'|'user'; owner_id: number; address: string; balance: number };
export type DevTransfer = { id: number; tx_hash: string; from_wallet: string|null; to_wallet: string|null; amount: number; memo: string|null; created_at: string };

export async function demoPurchase(companyId: number, amount: number = 200000) {
  return api<{ interaction_id: number; user_id: number; reward: number }>(`/dev/demo/purchase?company_id=${companyId}&amount=${amount}`, { method: 'POST' });
}
