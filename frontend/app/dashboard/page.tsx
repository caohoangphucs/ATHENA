"use client";
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { api, WalletOut, ContractOut, companySignup, getCompanyProfile, updateCompanyProfile, CompanyProfile } from '@/lib/api';

export default function Dashboard() {
  const search = useSearchParams();
  const prefillApiKey = search.get('apiKey') || '';

  const [apiKey, setApiKey] = useState(prefillApiKey);
  const [wallet, setWallet] = useState<WalletOut | null>(null);
  const [contracts, setContracts] = useState<ContractOut[]>([]);
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const step = useMemo(() => {
    if (!apiKey) return 1;                    // needs API key or signup
    if (!profile) return 2;                   // fill company profile & services
    if (!wallet) return 3;                    // load wallet master
    return 4;                                 // create contracts
  }, [apiKey, profile, wallet]);

  const load = async () => {
    if (!apiKey) return;
    setError(null); setLoading(true);
    try {
      const p = await getCompanyProfile(apiKey);
      setProfile(p);
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

  // Signup states
  const [signupName, setSignupName] = useState('Demo Company');
  const [signupSector, setSignupSector] = useState('Banking');
  const [signupTier, setSignupTier] = useState('basic');

  // Services states
  const [supportedActions, setSupportedActions] = useState('purchase,booking,referral');
  const [serviceCategories, setServiceCategories] = useState('banking,flight,real_estate');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

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

  const doSignup = async () => {
    setError(null); setLoading(true);
    try {
      const res = await companySignup({
        name: signupName,
        sector: signupSector,
        tier: signupTier,
        supported_actions: supportedActions.split(',').map(s=>s.trim()).filter(Boolean),
        service_categories: serviceCategories.split(',').map(s=>s.trim()).filter(Boolean),
        description, website, phone, email, address,
      });
      setApiKey(res.api_key);
    } catch (e:any) {
      setError(e.message || 'Signup failed');
    } finally { setLoading(false); }
  };

  const saveServices = async () => {
    if (!apiKey) return;
    setError(null); setLoading(true);
    try {
      const p = await updateCompanyProfile(apiKey, {
        description,
        website,
        phone,
        email,
        address,
        supported_actions: supportedActions.split(',').map(s=>s.trim()).filter(Boolean),
        service_categories: serviceCategories.split(',').map(s=>s.trim()).filter(Boolean),
      });
      setProfile(p);
    } catch (e:any) {
      setError(e.message || 'Save failed');
    } finally { setLoading(false); }
  };

  return (
    <main className="container py-8 grid gap-6">
      <Card>
        <CardHeader title="Onboarding Steps" />
        <CardBody>
          <ol className="grid md:grid-cols-4 gap-4">
            <li className={`p-3 rounded-md border ${step>=1? 'border-black dark:border-white':'border-neutral-300 dark:border-neutral-800'} transition-colors animate-fade-in`}>
              <div className="font-semibold">B1. Tạo Doanh Nghiệp / API Key</div>
              <div className="text-sm text-neutral-500">Đăng ký doanh nghiệp hoặc dán API Key</div>
            </li>
            <li className={`p-3 rounded-md border ${step>=2? 'border-black dark:border-white':'border-neutral-300 dark:border-neutral-800'} transition-colors animate-fade-in`}>
              <div className="font-semibold">B2. Khai báo Services</div>
              <div className="text-sm text-neutral-500">Xác định supported actions & categories</div>
            </li>
            <li className={`p-3 rounded-md border ${step>=3? 'border-black dark:border-white':'border-neutral-300 dark:border-neutral-800'} transition-colors animate-fade-in`}>
              <div className="font-semibold">B3. Ví Master</div>
              <div className="text-sm text-neutral-500">Xem địa chỉ ví và số dư SOV</div>
            </li>
            <li className={`p-3 rounded-md border ${step>=4? 'border-black dark:border-white':'border-neutral-300 dark:border-neutral-800'} transition-colors animate-fade-in`}>
              <div className="font-semibold">B4. Contract Reward</div>
              <div className="text-sm text-neutral-500">Tạo contract và nhận endpoint + secret</div>
            </li>
          </ol>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Company Context" />
        <CardBody>
          <div className="grid md:grid-cols-2 gap-6 items-start">
            <div className="grid gap-3">
              <div className="text-sm font-medium">Có API Key?</div>
              <div className="flex gap-2">
                <input className="flex-1 px-3 py-2 border rounded-md bg-white dark:bg-neutral-950 border-neutral-200/60 dark:border-neutral-800/60" placeholder="API Key (X-API-Key)" value={apiKey} onChange={e=>setApiKey(e.target.value)} />
                <button className="px-4 py-2 rounded-md bg-black text-white dark:bg-white dark:text-black" onClick={load} disabled={!apiKey || loading}>{loading? 'Loading…':'Load'}</button>
              </div>
              {error && <div className="text-red-600 text-sm">{error}</div>}
            </div>
            <div className="grid gap-3">
              <div className="text-sm font-medium">Chưa có? Đăng ký doanh nghiệp</div>
              <div className="grid md:grid-cols-3 gap-2">
                <input className="px-3 py-2 border rounded-md bg-white dark:bg-neutral-950 border-neutral-200/60 dark:border-neutral-800/60" placeholder="Tên Doanh Nghiệp" value={signupName} onChange={e=>setSignupName(e.target.value)} />
                <input className="px-3 py-2 border rounded-md bg-white dark:bg-neutral-950 border-neutral-200/60 dark:border-neutral-800/60" placeholder="Sector" value={signupSector} onChange={e=>setSignupSector(e.target.value)} />
                <select className="px-3 py-2 border rounded-md bg-white dark:bg-neutral-950 border-neutral-200/60 dark:border-neutral-800/60" value={signupTier} onChange={e=>setSignupTier(e.target.value)}>
                  <option value="basic">basic</option>
                  <option value="premium">premium</option>
                  <option value="enterprise">enterprise</option>
                </select>
              </div>
              <button className="justify-self-start px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700" onClick={doSignup} disabled={loading}>Đăng ký & Lấy API Key</button>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Services & Company Profile" />
        <CardBody>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm text-neutral-500">Supported Actions (comma-separated)</label>
              <input className="px-3 py-2 border rounded-md bg-white dark:bg-neutral-950 border-neutral-200/60 dark:border-neutral-800/60" value={supportedActions} onChange={e=>setSupportedActions(e.target.value)} />
              <label className="text-sm text-neutral-500 mt-2">Service Categories (comma-separated)</label>
              <input className="px-3 py-2 border rounded-md bg-white dark:bg-neutral-950 border-neutral-200/60 dark:border-neutral-800/60" value={serviceCategories} onChange={e=>setServiceCategories(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm text-neutral-500">Description</label>
              <input className="px-3 py-2 border rounded-md bg-white dark:bg-neutral-950 border-neutral-200/60 dark:border-neutral-800/60" value={description} onChange={e=>setDescription(e.target.value)} />
              <div className="grid grid-cols-2 gap-2 mt-2">
                <input placeholder="Website" className="px-3 py-2 border rounded-md bg-white dark:bg-neutral-950 border-neutral-200/60 dark:border-neutral-800/60" value={website} onChange={e=>setWebsite(e.target.value)} />
                <input placeholder="Phone" className="px-3 py-2 border rounded-md bg-white dark:bg-neutral-950 border-neutral-200/60 dark:border-neutral-800/60" value={phone} onChange={e=>setPhone(e.target.value)} />
                <input placeholder="Email" className="px-3 py-2 border rounded-md bg-white dark:bg-neutral-950 border-neutral-200/60 dark:border-neutral-800/60" value={email} onChange={e=>setEmail(e.target.value)} />
                <input placeholder="Address" className="px-3 py-2 border rounded-md bg-white dark:bg-neutral-950 border-neutral-200/60 dark:border-neutral-800/60 col-span-2" value={address} onChange={e=>setAddress(e.target.value)} />
              </div>
            </div>
          </div>
          <div className="mt-3">
            <button className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700" onClick={saveServices} disabled={!apiKey || loading}>Lưu Services</button>
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
