"use client";
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { api, WalletOut, ContractOut } from '@/lib/api';

export default function Dashboard() {
  const search = useSearchParams();
  const prefillApiKey = search.get('apiKey') || '';

  const [apiKey, setApiKey] = useState(prefillApiKey);
  const [wallet, setWallet] = useState<WalletOut | null>(null);
  const [contracts, setContracts] = useState<ContractOut[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const step = useMemo(() => {
    if (!apiKey) return 1;          // needs API key
    if (!wallet) return 2;          // load wallet master
    return 3;                        // create contracts
  }, [apiKey, wallet]);

  const load = async () => {
    if (!apiKey) return;
    setError(null); setLoading(true);
    try {
      const w = await api<WalletOut>(`/companies/wallets/master`, { apiKey });
      setWallet(w);
      const cs = await api<ContractOut[]>(`/contracts`, { apiKey });
      setContracts(cs);
    } catch (e: any) {
      setError(e.message || 'Failed to load');
    } finally { setLoading(false); }
  };

  useEffect(() => { if (apiKey) load(); }, [apiKey]);

  const [name, setName] = useState('VJ Purchase');
  const [action, setAction] = useState('purchase');
  const [mode, setMode] = useState('per_amount');
  const [rate, setRate] = useState(2);

  const createContract = async () => {
    if (!apiKey) return;
    setError(null); setLoading(true);
    try {
      await api(`/contracts`, { method: 'POST', body: JSON.stringify({ name, action, mode, rate }), apiKey });
      await load();
    } catch (e: any) {
      setError(e.message || 'Failed to create');
    } finally { setLoading(false); }
  };

  return (
    <main className="container py-8 grid gap-6">
      <Card>
        <CardHeader title="Onboarding Steps" />
        <CardBody>
          <ol className="grid md:grid-cols-3 gap-4">
            <li className={`p-3 rounded-md border ${step>=1? 'border-black dark:border-white':'border-neutral-300 dark:border-neutral-800'} transition-colors`}>
              <div className="font-semibold">B1. API Key</div>
              <div className="text-sm text-neutral-500">Dán API Key (X-API-Key) để tiếp tục</div>
            </li>
            <li className={`p-3 rounded-md border ${step>=2? 'border-black dark:border-white':'border-neutral-300 dark:border-neutral-800'} transition-colors`}>
              <div className="font-semibold">B2. Ví Master</div>
              <div className="text-sm text-neutral-500">Xem địa chỉ ví và số dư SOV</div>
            </li>
            <li className={`p-3 rounded-md border ${step>=3? 'border-black dark:border-white':'border-neutral-300 dark:border-neutral-800'} transition-colors`}>
              <div className="font-semibold">B3. Contract Reward</div>
              <div className="text-sm text-neutral-500">Tạo contract và nhận endpoint + secret</div>
            </li>
          </ol>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Company Context" />
        <CardBody>
          <div className="grid md:grid-cols-3 gap-3 items-start">
            <input className="px-3 py-2 border rounded-md bg-white dark:bg-neutral-950 border-neutral-200/60 dark:border-neutral-800/60" placeholder="API Key (X-API-Key)" value={apiKey} onChange={e=>setApiKey(e.target.value)} />
            <button className="px-4 py-2 rounded-md bg-black text-white dark:bg-white dark:text-black" onClick={load} disabled={!apiKey || loading}>{loading? 'Loading…':'Load'}</button>
            {error && <div className="text-red-600 text-sm">{error}</div>}
          </div>
        </CardBody>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Master Wallet" />
          <CardBody>
            {wallet ? (
              <div className="animate-fade-in">
                <div className="text-sm text-neutral-500">Address</div>
                <div className="font-mono break-all text-sm">{wallet.address}</div>
                <div className="mt-2 text-sm text-neutral-500">Balance</div>
                <div className="text-2xl font-semibold">{wallet.balance.toLocaleString()} SOV</div>
              </div>
            ) : (
              <div className="text-neutral-500">Enter API Key then Load</div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Create Contract" />
          <CardBody>
            <div className="grid md:grid-cols-2 gap-3">
              <input className="px-3 py-2 border rounded-md bg-white dark:bg-neutral-950 border-neutral-200/60 dark:border-neutral-800/60" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
              <select className="px-3 py-2 border rounded-md bg-white dark:bg-neutral-950 border-neutral-200/60 dark:border-neutral-800/60" value={action} onChange={e=>setAction(e.target.value)}>
                <option value="purchase">purchase</option>
                <option value="booking">booking</option>
                <option value="referral">referral</option>
              </select>
              <select className="px-3 py-2 border rounded-md bg-white dark:bg-neutral-950 border-neutral-200/60 dark:border-neutral-800/60" value={mode} onChange={e=>setMode(e.target.value)}>
                <option value="per_amount">per_amount</option>
                <option value="flat">flat</option>
              </select>
              <input type="number" className="px-3 py-2 border rounded-md bg-white dark:bg-neutral-950 border-neutral-200/60 dark:border-neutral-800/60" placeholder="Rate" value={rate} onChange={e=>setRate(Number(e.target.value)||0)} />
              <button className="px-4 py-2 rounded-md bg-black text-white dark:bg-white dark:text-black" onClick={createContract} disabled={!apiKey || loading}>{loading? 'Saving…':'Create'}</button>
            </div>
            <p className="mt-3 text-xs text-neutral-500">Use: POST /contracts/{'{cid}'}/events with headers X-API-Key + X-Contract-Secret</p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Contracts" />
        <CardBody>
          <div className="grid gap-3">
            {contracts.map(c => (
              <div key={c.id} className="p-3 rounded-md border border-neutral-200/60 dark:border-neutral-800/60 animate-fade-in">
                <div className="font-medium">{c.name}</div>
                <div className="text-sm text-neutral-500">{c.action} · {c.mode} · rate={c.rate}</div>
              </div>
            ))}
            {!contracts.length && <div className="text-neutral-500">No contracts yet.</div>}
          </div>
        </CardBody>
      </Card>
    </main>
  );
}
