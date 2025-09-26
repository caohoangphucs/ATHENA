"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { api, CompanySignupOut } from '@/lib/api';

export default function Page() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState('DemoCo');
  const [signup, setSignup] = useState<CompanySignupOut | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    setError(null); setLoading(true);
    try {
      const out = await api<CompanySignupOut>('/companies/signup', {
        method: 'POST',
        body: JSON.stringify({ name: companyName })
      });
      setSignup(out);
      // Redirect to dashboard carrying apiKey so user continues with Step 2 and 3
      router.push(`/dashboard?apiKey=${encodeURIComponent(out.api_key)}`);
    } catch (e: any) {
      setError(e.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <section className="border-b border-neutral-200/60 dark:border-neutral-800/60">
        <div className="container py-16">
          <h1 className="text-4xl font-bold">Plug-in Rewards in 5 Minutes</h1>
          <p className="mt-3 text-neutral-600 dark:text-neutral-300">Developer-first loyalty engine for the Sovico ecosystem.</p>
          <div className="mt-6 flex gap-2">
            <input className="px-3 py-2 border rounded-md bg-white dark:bg-neutral-950 border-neutral-200/60 dark:border-neutral-800/60" value={companyName} onChange={e=>setCompanyName(e.target.value)} placeholder="Company name" />
            <button disabled={loading} onClick={handleSignup} className="px-4 py-2 rounded-md bg-black text-white dark:bg-white dark:text-black disabled:opacity-60">{loading ? 'Creating…' : 'Tích hợp ngay'}</button>
          </div>
          {error && <p className="mt-3 text-red-600">{error}</p>}
        </div>
      </section>

      <section>
        <div className="container py-12 grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader title="B1. Đăng ký tài khoản DN" />
            <CardBody>
              Tạo API Key và ví master tự động. Sau khi tạo, bạn sẽ được điều hướng tới Dashboard để hoàn tất tích hợp.
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="B2. Tạo ví master" />
            <CardBody>
              Ví master được cấp SOV demo. Dashboard sẽ hiển thị số dư ngay lập tức.
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="B3. Tạo smart contract reward" />
            <CardBody>
              Tại Dashboard, tạo contract (action/mode/rate) và nhận endpoint + X-Contract-Secret để tích hợp.
            </CardBody>
          </Card>
        </div>
      </section>
    </main>
  );
}
