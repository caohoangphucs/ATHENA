"use client";
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpring, animated, to } from 'react-spring';
import { useDrag, useWheel } from 'react-use-gesture';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { api, DevCompany, DevTransfer, DevWallet, demoPurchase } from '@/lib/api';

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
  const [currentTransferIndex, setCurrentTransferIndex] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cs, ws, ts] = await Promise.all([
        api<DevCompany[]>(`/dev/companies`),
        api<DevWallet[]>(`/dev/wallets`),
        api<DevTransfer[]>(`/dev/transfers?limit=30`),
      ]);
      setCompanies(cs); setWallets(ws); setTransfers(ts);
    } catch (e: any) {
      setError(e.message || 'Failed to load data');
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { load(); }, []);
  useInterval(() => load(), 4000);

  // Sequential transfer animation
  useEffect(() => {
    if (transfers.length === 0) {
      setVisibleTransfers([]);
      setCurrentTransferIndex(0);
      return;
    }

    const sortedTransfers = [...transfers].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    if (currentTransferIndex < sortedTransfers.length) {
      const timer = setTimeout(() => {
        setVisibleTransfers(prev => [...prev, sortedTransfers[currentTransferIndex]]);
        setCurrentTransferIndex(prev => prev + 1);
      }, 800); // 800ms delay between each transfer

      return () => clearTimeout(timer);
    }
  }, [transfers, currentTransferIndex]);

  // Reset when new transfers come in
  useEffect(() => {
    if (transfers.length > 0) {
      setVisibleTransfers([]);
      setCurrentTransferIndex(0);
    }
  }, [transfers.length]);

  // Canvas / layout
  const canvas = { width: 2000, height: 1200 };
  const leftX = 500, rightX = 1500;
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
    // Soft clamp panning to avoid flying off
    const pad = 300;
    const clampedX = clamp(newX, -canvas.width + pad, canvas.width - pad);
    const clampedY = clamp(newY, -canvas.height + pad, canvas.height - pad);
    springApi.start({ x: clampedX, y: clampedY, immediate: true });
    return memo;
  });

  const bindWheel = useWheel(({ delta: [, dy] }) => {
    const current = scale.get();
    // Reduce sensitivity
    const next = clamp(current - dy * 0.0008, 0.3, 3.0);
    springApi.start({ scale: next });
  });

  // Deterministic node layout
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

  const walletByAddress = useMemo(() => Object.fromEntries(wallets.map(w => [w.address, w])), [wallets]);

  function TransferEdge({ from, to, amount, idx, isVisible }: { from: string|null; to: string|null; amount: number; idx: number; isVisible: boolean }) {
    if (!from || !to || !isVisible) return null;
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

    return (
      <g>
        <motion.line x1={fx} y1={fy} x2={tx} y2={ty} stroke={isCompanyToUser ? '#f59e0b' : isUserToCompany ? '#10b981' : '#22c55e'} strokeOpacity={0.6} strokeWidth={4}
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, ease: 'easeOut' }} />
        <motion.circle cx={fx} cy={fy} r={8} fill={isCompanyToUser ? '#f59e0b' : isUserToCompany ? '#10b981' : '#16a34a'}
          initial={{ cx: fx, cy: fy, opacity: 0, scale: 0.5 }} animate={{ cx: tx, cy: ty, opacity: 1, scale: 1.2 }} transition={{ duration: 2, ease: 'easeOut' }} />
        <motion.text x={(fx+tx)/2} y={(fy+ty)/2 - 10} fontSize={18} className="fill-current font-bold"
          style={{ fill: isCompanyToUser ? '#f59e0b' : isUserToCompany ? '#10b981' : '#16a34a' }}
          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
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
      // Reload data immediately to get updated balances
      await load();
      setTimeout(()=>setPulseCompany(null), 2000);
    } catch {
      setPulseCompany(null);
    }
  };

  const createUserForCompany = async (companyId: number) => {
    const company = companies.find(c => c.id === companyId);
    if (!company) { setError('Company not found'); return; }
    try {
      await api(`/users`, { method: 'POST', body: JSON.stringify({ full_name: `Demo User ${Math.floor(Math.random()*1000)}`, email: `demo_${companyId}_${Date.now()}@example.com`, phone: `+84${Math.floor(Math.random()*900000000) + 100000000}`, segment: 'demo' }), apiKey: company.api_key });
      // Reload data immediately to get new user and wallet
      await load();
    } catch (e: any) { setError(e.message || 'Failed to create user'); }
  };

  const resetView = () => { springApi.start({ scale: 1, x: 0, y: 0 }); };

  const gTransform = to([x, y, scale], (tx, ty, s) => `translate(${tx},${ty}) scale(${s})`);

  const toggleFullscreen = () => {
    const el = wrapperRef.current;
    if (!el) return;
    if (!document.fullscreenElement) { 
      el.requestFullscreen?.().then(() => {
        // Adjust SVG size for fullscreen
        if (svgRef.current) {
          svgRef.current.style.height = '100vh';
          svgRef.current.style.width = '100vw';
        }
      });
    }
    else { 
      document.exitFullscreen?.().then(() => {
        // Reset SVG size when exiting fullscreen
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
                          <motion.foreignObject x={n.x + 50} y={n.y - 40} width="220" height="120" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }}>
                            <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 shadow-lg">
                              <div className="font-semibold text-sm">{n.name}</div>
                              <div className="text-xs text-neutral-500">Company ID: {n.id}</div>
                              <div className="text-xs text-neutral-500">Created: {new Date(n.created_at).toLocaleDateString()}</div>
                              <div className="flex gap-2 mt-2">
                                <button onClick={() => createUserForCompany(n.id)} className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">Create User</button>
                                <button onClick={() => onDemoPurchase(n.id)} className="px-2 py-1 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700">Demo Purchase</button>
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

                {visibleTransfers.map((t, idx) => (
                  <TransferEdge key={t.tx_hash} from={t.from_wallet} to={t.to_wallet} amount={t.amount} idx={idx} isVisible={true} />
                ))}
              </animated.g>
            </svg>
          </div>
        </CardBody>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
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
          <CardHeader title="Wallets" />
          <CardBody>
            <div className="grid gap-2 max-h-80 overflow-auto pr-2">
              {wallets.map((w, i) => (
                <motion.div key={w.id} className="p-3 rounded-md border border-neutral-200/60 dark:border-neutral-800/60" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i*0.02 }}>
                  <div className="text-xs text-neutral-500">{w.owner_type} #{w.owner_id}</div>
                  <div className="font-mono text-xs break-all">{w.address}</div>
                  <div className="text-sm mt-1">{(w.balance || 0).toLocaleString()} SOV</div>
                </motion.div>
              ))}
              {!wallets.length && <div className="text-neutral-500">No wallets yet.</div>}
            </div>
          </CardBody>
        </Card>
      </div>
    </main>
  );
}
