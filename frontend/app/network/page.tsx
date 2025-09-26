"use client";
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpring, animated, to } from 'react-spring';
import { useDrag, useWheel } from 'react-use-gesture';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { api, DevCompany, DevTransfer, DevWallet, demoPurchase, demoUserPurchase } from '@/lib/api';

function useInterval(callback: () => void, delay: number) {
  const saved = useRef(callback);
  useEffect(() => { saved.current = callback; });
  useEffect(() => {
    if (delay === null) return;
    const id = setInterval(() => saved.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

function seeded(id: number, min: number, max: number) {
  const x = Math.sin(id * 99991) * 10000;
  const frac = x - Math.floor(x);
  return min + frac * (max - min);
}

export default function Network() {
  const [companies, setCompanies] = useState<DevCompany[]>([]);
  const [wallets, setWallets] = useState<DevWallet[]>([]);
  const [transfers, setTransfers] = useState<DevTransfer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pulseCompany, setPulseCompany] = useState<number | null>(null);
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<number | null>(null);
  const [visibleTransfers, setVisibleTransfers] = useState<DevTransfer[]>([]);
  const [shownTxs, setShownTxs] = useState<Set<string>>(new Set());
  const [companyServices, setCompanyServices] = useState<any>(null);
  const [userTransactions, setUserTransactions] = useState<any>(null);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Load shown txs from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('athena_shown_txs');
      if (raw) setShownTxs(new Set(JSON.parse(raw)));
    } catch {}
  }, []);

  const persistShown = (setRef: Set<string>) => {
    try { localStorage.setItem('athena_shown_txs', JSON.stringify(Array.from(setRef))); } catch {}
  };

  const markTxShown = (tx: string | null | undefined) => {
    if (!tx) return;
    setShownTxs(prev => {
      const next = new Set(prev);
      if (!next.has(tx)) {
        next.add(tx);
        persistShown(next);
      }
      return next;
    });
    // also remove from currently visible list to avoid lingering
    setVisibleTransfers(prev => prev.filter(p => p.tx_hash !== tx));
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cs, ws, ts] = await Promise.all([
        api<DevCompany[]>(`/dev/companies`),
        api<DevWallet[]>(`/dev/wallets`),
        api<DevTransfer[]>(`/dev/transfers?limit=50`),
      ]);
      setCompanies(cs); setWallets(ws); setTransfers(ts);
    } catch (e: any) {
      setError(e.message || 'Failed to load data');
    } finally { 
      setLoading(false); 
    }
  };

  const loadCompanyServices = async (companyId: number) => {
    setLoadingServices(true);
    try {
      const services = await api(`/companies/${companyId}/services`);
      setCompanyServices(services);
    } catch (e: any) {
      setError(e.message || 'Failed to load company services');
    } finally {
      setLoadingServices(false);
    }
  };

  const loadUserTransactions = async (userId: number) => {
    setLoadingTransactions(true);
    try {
      const transactions = await api(`/dev/users/${userId}/transactions`);
      setUserTransactions(transactions);
    } catch (e: any) {
      setError(e.message || 'Failed to load user transactions');
    } finally {
      setLoadingTransactions(false);
    }
  };

  const generateDefaultData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api(`/dev/seed_sovico`, { method: 'POST' });
      console.log('Default Sovico data generated:', result);
      await load();
    } catch (e: any) {
      setError(e.message || 'Failed to generate default data');
    } finally {
      setLoading(false);
    }
  };

  const resetAllData = async () => {
    if (!confirm('Are you sure you want to reset all data? This will delete all companies, users, wallets, and transactions permanently.')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      await api(`/dev/reset`, { method: 'POST' });
      // Clear localStorage shown transfers
      localStorage.removeItem('athena_shown_txs');
      setShownTxs(new Set());
      setVisibleTransfers([]);
      await load();
    } catch (e: any) {
      setError(e.message || 'Failed to reset data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  
  // Only load new data when there are no visible transfers animating
  useInterval(() => {
    if (visibleTransfers.length === 0) {
      load();
    }
  }, 2000);

  // Compute which transfers to show now: unseen ones (by localStorage), newest first, up to 8 at a time
  useEffect(() => {
    if (!transfers.length) { setVisibleTransfers([]); return; }
    const unseen = transfers
      .slice()
      .sort((a,b)=> new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .filter(t => t.tx_hash && !shownTxs.has(t.tx_hash));
    
    // Show transfers with 100ms intervals
    if (unseen.length > 0) {
      const newVisible = unseen.slice(0, 8);
      setVisibleTransfers(newVisible);
      
      // Schedule each transfer to appear with 100ms delay
      newVisible.forEach((transfer, index) => {
        setTimeout(() => {
          // This will trigger the animation for this specific transfer
        }, index * 100);
      });
    }
  }, [transfers, shownTxs]);

  // Canvas / layout
  const canvas = { width: 2000, height: 1200 };
  const leftX = 800, rightX = 1200;  // Reduced distance from 1000px to 400px
  const topY = 120, bottomY = canvas.height - 120;

  // Spring for pan/zoom
  const [{ scale, x, y }, springApi] = useSpring(() => ({
    scale: 1,
    x: 0,
    y: 0,
    config: { tension: 250, friction: 28 }
  }));

  // Clamp helpers
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

  // Gestures
  const bindDrag = useDrag(({ movement: [mx, my], memo = { startX: x.get(), startY: y.get() } }) => {
    const newX = memo.startX + mx;
    const newY = memo.startY + my;
    const pad = 300;
    const clampedX = clamp(newX, -canvas.width + pad, canvas.width - pad);
    const clampedY = clamp(newY, -canvas.height + pad, canvas.height - pad);
    springApi.start({ x: clampedX, y: clampedY, immediate: true });
    return memo;
  });

  const bindWheel = useWheel(({ delta: [, dy] }) => {
    const current = scale.get();
    const next = clamp(current - dy * 0.0008, 0.3, 3.0);
    springApi.start({ scale: next });
  });

  const companyNodes = useMemo(() => {
    const sorted = [...companies].sort((a,b)=>a.id-b.id);
    const count = Math.max(1, sorted.length);
    return sorted.map((c, i) => {
      const y = topY + (i + 0.5) * ((bottomY - topY) / count) + seeded(c.id, -40, 40);
      const x = rightX + seeded(c.id, -60, 60);
      return { ...c, x, y } as DevCompany & { x: number; y: number };
    });
  }, [companies]);

  const userNodes = useMemo(() => {
    const users = wallets.filter(w => w.owner_type === 'user');
    const sorted = [...users].sort((a,b)=>a.owner_id-b.owner_id);
    const count = Math.max(1, sorted.length);
    return sorted.map((w, i) => {
      const y = topY + (i + 0.5) * ((bottomY - topY) / count) + seeded(w.id, -60, 60);
      const x = leftX + seeded(w.id, -80, 80);
      const company = companies.find(c => c.id === w.owner_id);
      return { ...w, x, y, company_name: company?.name || 'Unknown' };
    });
  }, [wallets, companies]);

  // Get users for a specific company
  const getUsersForCompany = (companyId: number) => {
    return userNodes.filter(u => {
      const company = companies.find(c => c.id === companyId);
      return company && u.owner_id === companyId;
    });
  };

  const walletByAddress = useMemo(() => Object.fromEntries(wallets.map(w => [w.address, w])), [wallets]);

  function TransferEdge({ from, to, amount, onDone }: { from: string|null; to: string|null; amount: number; onDone: () => void }) {
    if (!from || !to) return null;
    const wf = walletByAddress[from];
    const wt = walletByAddress[to];
    if (!wf || !wt) return null;

    const fromNode = wf.owner_type==='company' ? companyNodes.find(n=>n.id===wf.owner_id) : userNodes.find(n=>n.owner_id===wf.owner_id);
    const toNode = wt.owner_type==='company' ? companyNodes.find(n=>n.id===wt.owner_id) : userNodes.find(n=>n.owner_id===wt.owner_id);
    const fx = fromNode?.x ?? rightX;
    const fy = fromNode?.y ?? (topY + bottomY)/2;
    const tx = toNode?.x ?? leftX;
    const ty = toNode?.y ?? (topY + bottomY)/2;

    const isCompanyToUser = wf.owner_type === 'company' && wt.owner_type === 'user';
    const isUserToCompany = wf.owner_type === 'user' && wt.owner_type === 'company';
    const accent = isCompanyToUser ? '#f59e0b' : isUserToCompany ? '#10b981' : '#22c55e';

    return (
      <g>
        <motion.line x1={fx} y1={fy} x2={tx} y2={ty} stroke={accent} strokeOpacity={0.6} strokeWidth={4}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.0, ease: 'easeOut' }}
          onAnimationComplete={() => {
            // Add a small delay before calling onDone to ensure text animation completes
            setTimeout(onDone, 500);
          }}
        />
        <motion.text x={(fx+tx)/2} y={(fy+ty)/2 - 8} fontSize={16} className="fill-current font-bold"
          style={{ fill: accent }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          {amount.toFixed(2)} SOV
        </motion.text>
      </g>
    );
  }

  const onDemoPurchase = async (companyId: number) => {
    setPulseCompany(companyId);
    setSelectedCompany(companyId);
    try {
      await demoPurchase(companyId, 200000 + Math.floor(Math.random()*300000));
      await load();
      setTimeout(()=>setPulseCompany(null), 2000);
    } catch {
      setPulseCompany(null);
    }
  };

  const onDemoUserPurchase = async (companyId: number, userId: number) => {
    setPulseCompany(companyId);
    setSelectedCompany(companyId);
    try {
      await demoUserPurchase(companyId, userId, 200000 + Math.floor(Math.random()*300000));
      await load();
      setTimeout(()=>setPulseCompany(null), 2000);
    } catch (e: any) {
      setError(e.message || 'Failed to process user purchase');
      setPulseCompany(null);
    }
  };

  const createUserForCompany = async (companyId: number) => {
    const company = companies.find(c => c.id === companyId);
    if (!company) { setError('Company not found'); return; }
    try {
      await api(`/users`, { method: 'POST', body: JSON.stringify({ full_name: `Demo User ${Math.floor(Math.random()*1000)}`, email: `demo_${companyId}_${Date.now()}@example.com`, phone: `+84${Math.floor(Math.random()*900000000) + 100000000}`, segment: 'demo' }), apiKey: company.api_key });
      await load();
    } catch (e: any) { setError(e.message || 'Failed to create user'); }
  };

  const removeCompany = async (companyId: number) => {
    const company = companies.find(c => c.id === companyId);
    if (!company) { setError('Company not found'); return; }
    if (!confirm(`Are you sure you want to remove "${company.name}"? This will delete the company and all associated data permanently.`)) {
      return;
    }
    try {
      await api(`/companies/${companyId}`, { method: 'DELETE', apiKey: company.api_key });
      await load();
    } catch (e: any) { setError(e.message || 'Failed to remove company'); }
  };

  const resetView = () => { springApi.start({ scale: 1, x: 0, y: 0 }); };

  const gTransform = to([x, y, scale], (tx, ty, s) => `translate(${tx},${ty}) scale(${s})`);

  const toggleFullscreen = () => {
    const el = wrapperRef.current;
    if (!el) return;
    if (!document.fullscreenElement) { 
      el.requestFullscreen?.().then(() => {
        if (svgRef.current) {
          svgRef.current.style.height = '100vh';
          svgRef.current.style.width = '100vw';
        }
      });
    }
    else { 
      document.exitFullscreen?.().then(() => {
        if (svgRef.current) {
          svgRef.current.style.height = '600px';
          svgRef.current.style.width = '100%';
        }
      });
    }
  };

  return (
    <main className="container py-8 grid gap-6">
      <Card>
        <CardHeader title="Network Overview" />
        <CardBody>
          <div className="flex items-center justify-between">
            <div className="text-sm text-neutral-500">
              All companies and wallets (demo) • Drag to pan • Scroll to zoom
              {loading && <span className="ml-2 text-blue-600">Loading...</span>}
              {error && <span className="ml-2 text-red-600">Error: {error}</span>}
            </div>
            <div className="flex gap-2">
              <button onClick={load} className="px-3 py-2 rounded-md border border-neutral-200/60 dark:border-neutral-800/60">Refresh</button>
              <button onClick={generateDefaultData} className="px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">Generate Default Data</button>
              <button onClick={resetAllData} className="px-3 py-2 rounded-md bg-red-600 text-white hover:bg-red-700">Reset All Data</button>
              <button onClick={resetView} className="px-3 py-2 rounded-md border border-neutral-200/60 dark:border-neutral-800/60">Reset View</button>
              <button onClick={toggleFullscreen} className="px-3 py-2 rounded-md border border-neutral-200/60 dark:border-neutral-800/60">Fullscreen</button>
              <Link className="px-3 py-2 rounded-md border border-neutral-200/60 dark:border-neutral-800/60" href="/">Landing</Link>
              <Link className="px-3 py-2 rounded-md bg-black text-white dark:bg-white dark:text-black" href="/dashboard">Go to Dashboard</Link>
            </div>
          </div>
          <div ref={wrapperRef} className="mt-6 relative overflow-hidden rounded-xl border border-neutral-200/60 dark:border-neutral-800/60">
            <svg ref={svgRef} width="100%" height="600" viewBox={`0 0 ${canvas.width} ${canvas.height}`} className="block bg-neutral-50 dark:bg-neutral-900 cursor-grab active:cursor-grabbing" style={{ minHeight: '600px' }} {...bindDrag()} {...bindWheel()}>
              <animated.g transform={gTransform}>
                <AnimatePresence>
                  {companyNodes.map((n, i) => (
                    <motion.g key={`company-${n.id}`} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: pulseCompany===n.id ? 1.1 : 1 }} transition={{ delay: i * 0.05, type: 'spring', stiffness: 260, damping: 20 }} onMouseEnter={() => setHoveredNode(n.id)} onMouseLeave={() => setHoveredNode(null)}>
                      <motion.circle cx={n.x} cy={n.y} r={36} className="fill-yellow-400 stroke-yellow-600" strokeWidth={3} whileHover={{ scale: 1.06 }} />
                      <text x={n.x} y={n.y-2} textAnchor="middle" className="text-[12px] fill-black font-semibold pointer-events-none">{n.name}</text>
                      <text x={n.x} y={n.y+14} textAnchor="middle" className="text-[10px] fill-black pointer-events-none">Company {n.id}</text>
                      <AnimatePresence>
                        {hoveredNode === n.id && (
                          <motion.foreignObject x={n.x + 50} y={n.y - 40} width="240" height="160" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }}>
                            <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 shadow-lg">
                              <div className="font-semibold text-sm">{n.name}</div>
                              <div className="text-xs text-neutral-500">Company ID: {n.id}</div>
                              <div className="text-xs text-neutral-500">Created: {new Date(n.created_at).toLocaleDateString()}</div>
                              
                              {/* User Purchase Demo */}
                              {getUsersForCompany(n.id).length > 0 && (
                                <div className="mt-2">
                                  <div className="text-xs text-neutral-600 mb-1">Demo User Purchase:</div>
                                  <select 
                                    className="w-full text-xs p-1 border border-neutral-300 rounded mb-2"
                                    onChange={(e) => {
                                      const userId = parseInt(e.target.value);
                                      if (userId) onDemoUserPurchase(n.id, userId);
                                    }}
                                    defaultValue=""
                                  >
                                    <option value="">Select user...</option>
                                    {getUsersForCompany(n.id).map(user => (
                                      <option key={user.id} value={user.id}>
                                        User #{user.id} ({(user.balance || 0).toLocaleString()} SOV)
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}
                              
                              <div className="flex gap-1 mt-2 flex-wrap">
                                <button onClick={() => createUserForCompany(n.id)} className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">Create User</button>
                                <button onClick={() => onDemoPurchase(n.id)} className="px-2 py-1 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700">Demo Purchase</button>
                                <button onClick={() => removeCompany(n.id)} className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700">Remove</button>
                              </div>
                            </div>
                          </motion.foreignObject>
                        )}
                      </AnimatePresence>
                    </motion.g>
                  ))}
                  {userNodes.map((n: any, i) => (
                    <motion.g key={`user-${n.id}`} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.02, type: 'spring', stiffness: 300, damping: 25 }} onMouseEnter={() => setHoveredNode(-n.id)} onMouseLeave={() => setHoveredNode(null)}>
                      <motion.circle cx={n.x} cy={n.y} r={20} className="fill-green-400 stroke-green-600" strokeWidth={2} whileHover={{ scale: 1.1 }} />
                      <text x={n.x} y={n.y+2} textAnchor="middle" className="text-[10px] fill-black font-medium pointer-events-none">User</text>
                      <text x={n.x} y={n.y+12} textAnchor="middle" className="text-[8px] fill-black pointer-events-none">#{n.owner_id}</text>
                      <AnimatePresence>
                        {hoveredNode === -n.id && (
                          <motion.foreignObject x={n.x + 30} y={n.y - 20} width="180" height="60" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }}>
                            <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-2 shadow-lg">
                              <div className="font-semibold text-xs">User #{n.owner_id}</div>
                              <div className="text-xs text-neutral-500">{n.company_name}</div>
                              <div className="text-xs text-green-600">{(n.balance || 0).toLocaleString()} SOV</div>
                            </div>
                          </motion.foreignObject>
                        )}
                      </AnimatePresence>
                    </motion.g>
                  ))}
                </AnimatePresence>

                {visibleTransfers.map((t) => (
                  <TransferEdge key={t.tx_hash} from={t.from_wallet} to={t.to_wallet} amount={t.amount} onDone={() => markTxShown(t.tx_hash)} />
                ))}
              </animated.g>
            </svg>
          </div>
        </CardBody>
      </Card>

      {/* Wallet Summary */}
      <Card>
        <CardHeader title="Wallet Summary" />
        <CardBody>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <div className="text-2xl font-bold text-green-600">
                {wallets.filter(w => w.owner_type === 'user').length}
              </div>
              <div className="text-sm text-green-600">User Wallets</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
              <div className="text-2xl font-bold text-yellow-600">
                {wallets.filter(w => w.owner_type === 'company').length}
              </div>
              <div className="text-sm text-yellow-600">Company Wallets</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div className="text-2xl font-bold text-blue-600">
                {wallets.filter(w => w.owner_type === 'user').reduce((sum, w) => sum + (w.balance || 0), 0).toLocaleString()}
              </div>
              <div className="text-sm text-blue-600">Total User SOV</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
              <div className="text-2xl font-bold text-purple-600">
                {wallets.filter(w => w.owner_type === 'company').reduce((sum, w) => sum + (w.balance || 0), 0).toLocaleString()}
              </div>
              <div className="text-sm text-purple-600">Total Company SOV</div>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader title="Companies" />
          <CardBody>
            <div className="grid gap-2">
              {companies.map((c, i) => (
                <motion.div key={c.id} className="p-3 rounded-md border border-neutral-200/60 dark:border-neutral-800/60" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i*0.03 }}>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-neutral-500">#{c.id} · {new Date(c.created_at).toLocaleString()}</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={()=>onDemoPurchase(c.id)} className="px-3 py-1.5 rounded-md bg-emerald-600 text-white text-sm">Demo Purchase</button>
                      <button onClick={()=>removeCompany(c.id)} className="px-3 py-1.5 rounded-md bg-red-600 text-white text-sm">Remove</button>
                      <Link className="px-3 py-1.5 rounded-md bg-black text-white dark:bg-white dark:text-black text-sm" href={`/dashboard?apiKey=${encodeURIComponent(c.api_key)}`}>Dashboard</Link>
                    </div>
                  </div>
                </motion.div>
              ))}
              {!companies.length && <div className="text-neutral-500">No companies yet.</div>}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="User Wallets" />
          <CardBody>
            <div className="grid gap-2 max-h-80 overflow-auto pr-2">
              {wallets.filter(w => w.owner_type === 'user').map((w, i) => {
                const user = userNodes.find(u => u.id === w.id);
                const company = companies.find(c => c.id === w.owner_id);
                return (
                  <motion.div key={w.id} className="p-3 rounded-md border border-green-200/60 dark:border-green-800/60 bg-green-50/50 dark:bg-green-900/20" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i*0.02 }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs text-green-600 font-medium">User #{w.owner_id}</div>
                      <div className="text-xs text-green-600 font-bold">{(w.balance || 0).toLocaleString()} SOV</div>
                    </div>
                    <div className="text-xs text-neutral-500 mb-1">{company?.name || 'Unknown Company'}</div>
                    <div className="font-mono text-xs break-all text-neutral-600 dark:text-neutral-400">{w.address}</div>
                  </motion.div>
                );
              })}
              {!wallets.filter(w => w.owner_type === 'user').length && <div className="text-neutral-500">No user wallets yet.</div>}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Company Wallets" />
          <CardBody>
            <div className="grid gap-2 max-h-80 overflow-auto pr-2">
              {wallets.filter(w => w.owner_type === 'company').map((w, i) => {
                const company = companies.find(c => c.id === w.owner_id);
                return (
                  <motion.div key={w.id} className="p-3 rounded-md border border-yellow-200/60 dark:border-yellow-800/60 bg-yellow-50/50 dark:bg-yellow-900/20" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i*0.02 }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs text-yellow-600 font-medium">{company?.name || 'Unknown Company'}</div>
                      <div className="text-xs text-yellow-600 font-bold">{(w.balance || 0).toLocaleString()} SOV</div>
                    </div>
                    <div className="text-xs text-neutral-500 mb-1">Company #{w.owner_id}</div>
                    <div className="font-mono text-xs break-all text-neutral-600 dark:text-neutral-400">{w.address}</div>
                  </motion.div>
                );
              })}
              {!wallets.filter(w => w.owner_type === 'company').length && <div className="text-neutral-500">No company wallets yet.</div>}
            </div>
          </CardBody>
        </Card>
      </div>
    </main>
  );
}
