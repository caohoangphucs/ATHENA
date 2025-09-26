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
export type CompanyProfile = {
  id: number;
  name: string;
  description?: string | null;
  sector?: string | null;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  business_license?: string | null;
  tax_code?: string | null;
  supported_actions?: string[] | null;
  service_categories?: string[] | null;
  is_active: boolean;
  tier?: string | null;
  created_at: string;
  updated_at?: string | null;
};
export type WalletOut = { address: string; balance: number };
export type ContractOut = { id: number; name: string; action: string; mode: string; rate: number; is_active: boolean };

export type DevCompany = { id: number; name: string; api_key: string; created_at: string };
export type DevWallet = { id: number; owner_type: 'company'|'user'; owner_id: number; address: string; balance: number };
export type DevTransfer = { id: number; tx_hash: string; from_wallet: string|null; to_wallet: string|null; amount: number; memo: string|null; created_at: string };

export async function demoPurchase(companyId: number, amount: number = 200000) {
  return api<{ interaction_id: number; user_id: number; reward: number }>(`/dev/demo/purchase?company_id=${companyId}&amount=${amount}`, { method: 'POST' });
}

export async function demoUserPurchase(companyId: number, userId: number, amount: number = 200000) {
  return api<{ interaction_id: number; user_id: number; company_wallet: string; user_wallet: string; reward: number; tx_hash: string }>(`/dev/user_purchase?company_id=${companyId}&user_id=${userId}&amount=${amount}`, { method: 'POST' });
}

// Company onboarding helpers
export async function companySignup(payload: {
  name: string;
  description?: string;
  sector?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  business_license?: string;
  tax_code?: string;
  supported_actions?: string[];
  service_categories?: string[];
  tier?: string;
}) {
  return api<CompanySignupOut>(`/companies/signup`, { method: 'POST', body: JSON.stringify(payload) });
}

export async function getCompanyProfile(apiKey: string) {
  return api<CompanyProfile>(`/companies/profile`, { apiKey });
}

export async function updateCompanyProfile(apiKey: string, payload: Partial<Omit<CompanyProfile, 'id'|'created_at'|'updated_at'|'is_active'>> & {
  supported_actions?: string[];
  service_categories?: string[];
}) {
  return api<CompanyProfile>(`/companies/profile`, { method: 'PUT', body: JSON.stringify(payload), apiKey });
}
