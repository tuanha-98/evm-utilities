'use client';

import { useState, useCallback, useRef } from 'react';
import styles from './benchmark.module.scss';

type BenchmarkTab = 'rpc' | 'mempool';

interface RpcEndpoint {
  url: string;
  latency: number | null;
  blockHeight: number | null;
  status: 'pending' | 'online' | 'offline';
}

interface Chain {
  id: number;
  name: string;
  symbol: string;
  rpcs: RpcEndpoint[];
}

const DEFAULT_CHAINS: Chain[] = [
  {
    id: 1,
    name: 'Ethereum',
    symbol: 'ETH',
    rpcs: [
      { url: 'https://ethereum-rpc.publicnode.com', latency: null, blockHeight: null, status: 'pending' },
      { url: 'https://mainnet.chainnodes.org/965bdfd2-af1b-4dfc-b69e-6e0c0a8847d5', latency: null, blockHeight: null, status: 'pending' },
    ],
  },
  {
    id: 56,
    name: 'Binance Smart Chain',
    symbol: 'BNB',
    rpcs: [
      { url: 'https://bsc-rpc.publicnode.com', latency: null, blockHeight: null, status: 'pending' },
      { url: 'https://bsc-mainnet.chainnodes.org/965bdfd2-af1b-4dfc-b69e-6e0c0a8847d5', latency: null, blockHeight: null, status: 'pending' },
    ],
  },
  {
    id: 8453,
    name: 'Base',
    symbol: 'BASE',
    rpcs: [
      { url: 'https://base-rpc.publicnode.com', latency: null, blockHeight: null, status: 'pending' },
      { url: 'https://base-mainnet.chainnodes.org/965bdfd2-af1b-4dfc-b69e-6e0c0a8847d5', latency: null, blockHeight: null, status: 'pending' },
    ],
  },
  {
    id: 88,
    name: 'Viction',
    symbol: 'VIC',
    rpcs: [
      { url: 'https://rpc.viction.xyz', latency: null, blockHeight: null, status: 'pending' },
      { url: 'https://viction.blockpi.network/v1/rpc/public', latency: null, blockHeight: null, status: 'pending' },
    ],
  },
];

async function measureLatency(url: string): Promise<{ latency: number; blockHeight: number | null; status: 'online' | 'offline' }> {
  const start = performance.now();
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error('HTTP error');
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    const latency = Math.round(performance.now() - start);
    const blockHeight = data.result ? parseInt(data.result, 16) : null;
    return { latency, blockHeight, status: 'online' };
  } catch {
    return { latency: -1, blockHeight: null, status: 'offline' };
  }
}

function getLatencyClass(latency: number | null): string {
  if (latency === null) return '';
  if (latency < 0) return styles.error;
  if (latency < 300) return styles.fast;
  if (latency < 800) return styles.medium;
  return styles.slow;
}

// --- Mempool types ---
interface MempoolRpc {
  url: string;
  label: string;
  uniqueTxs: Set<string>;
  firstSeenCount: number;
  totalSeen: number;
  avgResponseTime: number;
  responseCount: number;
  status: 'idle' | 'polling' | 'online' | 'offline';
}

interface MempoolSnapshot {
  time: number;
  rpcResults: { url: string; newTxs: string[]; responseTime: number }[];
  newTxsDiscovered: number;
}

const DEFAULT_MEMPOOL_RPCS: MempoolRpc[] = [
  { url: 'https://ethereum-rpc.publicnode.com', label: 'PublicNode', uniqueTxs: new Set(), firstSeenCount: 0, totalSeen: 0, avgResponseTime: 0, responseCount: 0, status: 'idle' },
  { url: 'https://mainnet.chainnodes.org/965bdfd2-af1b-4dfc-b69e-6e0c0a8847d5', label: 'ChainNodes', uniqueTxs: new Set(), firstSeenCount: 0, totalSeen: 0, avgResponseTime: 0, responseCount: 0, status: 'idle' },
];

async function fetchPendingTxs(url: string): Promise<{ txs: string[]; responseTime: number }> {
  const start = performance.now();
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_getBlockByNumber', params: ['pending', false], id: 1 }),
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();
    const responseTime = Math.round(performance.now() - start);
    const txs: string[] = data.result?.transactions || [];
    return { txs, responseTime };
  } catch {
    return { txs: [], responseTime: -1 };
  }
}

export default function Benchmarker() {
  const [activeTab, setActiveTab] = useState<BenchmarkTab>('rpc');
  const [chains, setChains] = useState<Chain[]>(DEFAULT_CHAINS);
  const [running, setRunning] = useState<Set<number>>(new Set());
  const [newRpcInputs, setNewRpcInputs] = useState<Record<number, string>>({});

  // Mempool state
  const [mempoolRpcs, setMempoolRpcs] = useState<MempoolRpc[]>(DEFAULT_MEMPOOL_RPCS);
  const [mempoolPolling, setMempoolPolling] = useState(false);
  const [mempoolHistory, setMempoolHistory] = useState<MempoolSnapshot[]>([]);
  const [newMempoolRpc, setNewMempoolRpc] = useState('');
  const [allSeenTxs, setAllSeenTxs] = useState<Set<string>>(new Set());
  const mempoolIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const benchmarkChain = useCallback(async (chainId: number) => {
    setRunning((prev) => new Set(prev).add(chainId));

    const chainIndex = chains.findIndex((c) => c.id === chainId);
    if (chainIndex === -1) return;

    const chain = chains[chainIndex];
    const results = await Promise.all(
      chain.rpcs.map(async (rpc) => {
        const result = await measureLatency(rpc.url);
        return { ...rpc, latency: result.latency, blockHeight: result.blockHeight, status: result.status };
      })
    );

    // Sort by latency (online first, then by speed)
    results.sort((a, b) => {
      if (a.status === 'offline' && b.status !== 'offline') return 1;
      if (a.status !== 'offline' && b.status === 'offline') return -1;
      return (a.latency ?? Infinity) - (b.latency ?? Infinity);
    });

    setChains((prev) => {
      const updated = [...prev];
      updated[chainIndex] = { ...updated[chainIndex], rpcs: results };
      return updated;
    });

    setRunning((prev) => {
      const next = new Set(prev);
      next.delete(chainId);
      return next;
    });
  }, [chains]);

  const addRpc = (chainId: number) => {
    const url = newRpcInputs[chainId]?.trim();
    if (!url || !url.startsWith('http')) return;

    setChains((prev) =>
      prev.map((chain) =>
        chain.id === chainId
          ? { ...chain, rpcs: [...chain.rpcs, { url, latency: null, blockHeight: null, status: 'pending' as const }] }
          : chain
      )
    );
    setNewRpcInputs((prev) => ({ ...prev, [chainId]: '' }));
  };

  const removeRpc = (chainId: number, url: string) => {
    setChains((prev) =>
      prev.map((chain) =>
        chain.id === chainId
          ? { ...chain, rpcs: chain.rpcs.filter((r) => r.url !== url) }
          : chain
      )
    );
  };

  const benchmarkAll = async () => {
    await Promise.all(chains.map((chain) => benchmarkChain(chain.id)));
  };

  // --- Mempool logic ---
  const pollOnce = useCallback(async () => {
    const results = await Promise.all(
      mempoolRpcs.map(async (rpc) => {
        const { txs, responseTime } = await fetchPendingTxs(rpc.url);
        return { url: rpc.url, txs, responseTime };
      })
    );

    // Determine which txs are newly discovered this poll (never seen before)
    const previouslySeen = allSeenTxs;
    const newGlobalTxs = new Set<string>();
    const rpcNewTxs: Record<string, string[]> = {};

    for (const r of results) {
      const newForThisRpc: string[] = [];
      for (const tx of r.txs) {
        if (!previouslySeen.has(tx)) {
          newGlobalTxs.add(tx);
          newForThisRpc.push(tx);
        }
      }
      rpcNewTxs[r.url] = newForThisRpc;
    }

    // Track which RPC saw each new tx FIRST (appeared in their results this poll)
    // If multiple RPCs see it in the same poll, credit the fastest responder
    const fastestForNewTx = new Map<string, string>(); // txHash → rpc url
    const sortedBySpeed = [...results].sort((a, b) => {
      if (a.responseTime < 0) return 1;
      if (b.responseTime < 0) return -1;
      return a.responseTime - b.responseTime;
    });

    for (const tx of newGlobalTxs) {
      for (const r of sortedBySpeed) {
        if (r.txs.includes(tx)) {
          fastestForNewTx.set(tx, r.url);
          break;
        }
      }
    }

    // Update global seen set
    const updatedSeen = new Set(previouslySeen);
    for (const tx of newGlobalTxs) updatedSeen.add(tx);
    setAllSeenTxs(updatedSeen);

    // Update RPC stats
    setMempoolRpcs((prev) =>
      prev.map((rpc) => {
        const r = results.find((res) => res.url === rpc.url);
        if (!r) return rpc;
        const firstSeenThisPoll = [...fastestForNewTx.entries()].filter(([, url]) => url === rpc.url).length;
        const newAvg = rpc.responseCount > 0 && r.responseTime > 0
          ? Math.round((rpc.avgResponseTime * rpc.responseCount + r.responseTime) / (rpc.responseCount + 1))
          : r.responseTime > 0 ? r.responseTime : rpc.avgResponseTime;
        return {
          ...rpc,
          uniqueTxs: new Set([...rpc.uniqueTxs, ...r.txs]),
          firstSeenCount: rpc.firstSeenCount + firstSeenThisPoll,
          totalSeen: rpc.uniqueTxs.size + r.txs.length,
          avgResponseTime: newAvg,
          responseCount: r.responseTime > 0 ? rpc.responseCount + 1 : rpc.responseCount,
          status: r.responseTime < 0 ? 'offline' : 'online',
        };
      })
    );

    setMempoolHistory((prev) => [...prev.slice(-29), {
      time: Date.now(),
      rpcResults: results.map(r => ({ url: r.url, newTxs: rpcNewTxs[r.url] || [], responseTime: r.responseTime })),
      newTxsDiscovered: newGlobalTxs.size,
    }]);
  }, [mempoolRpcs, allSeenTxs]);

  const startMempoolPolling = useCallback(() => {
    if (mempoolIntervalRef.current) return;
    setMempoolPolling(true);
    pollOnce();
    mempoolIntervalRef.current = setInterval(pollOnce, 3000);
  }, [pollOnce]);

  const stopMempoolPolling = useCallback(() => {
    setMempoolPolling(false);
    if (mempoolIntervalRef.current) {
      clearInterval(mempoolIntervalRef.current);
      mempoolIntervalRef.current = null;
    }
  }, []);

  const addMempoolRpc = () => {
    const url = newMempoolRpc.trim();
    if (!url || !url.startsWith('http')) return;
    const label = url.replace(/^https?:\/\//, '').split('/')[0].split('.').slice(0, 2).join('.');
    setMempoolRpcs((prev) => [...prev, { url, label, uniqueTxs: new Set(), firstSeenCount: 0, totalSeen: 0, avgResponseTime: 0, responseCount: 0, status: 'idle' }]);
    setNewMempoolRpc('');
  };

  const removeMempoolRpc = (url: string) => {
    setMempoolRpcs((prev) => prev.filter((r) => r.url !== url));
  };

  const resetMempool = () => {
    stopMempoolPolling();
    setAllSeenTxs(new Set());
    setMempoolHistory([]);
    setMempoolRpcs((prev) => prev.map(r => ({ ...r, uniqueTxs: new Set(), firstSeenCount: 0, totalSeen: 0, avgResponseTime: 0, responseCount: 0, status: 'idle' })));
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Benchmarker</h1>
        <p className={styles.subtitle}>
          Performance benchmarks for EVM infrastructure.
        </p>
        <div className={styles.benchTabs}>
          <button
            className={`${styles.benchTab} ${activeTab === 'rpc' ? styles.active : ''}`}
            onClick={() => setActiveTab('rpc')}
          >
            RPC Latency
          </button>
          <button
            className={`${styles.benchTab} ${activeTab === 'mempool' ? styles.active : ''}`}
            onClick={() => setActiveTab('mempool')}
          >
            Mempool Speed
          </button>
        </div>
      </div>

      {activeTab === 'rpc' && (
      <div className={styles.tabContent}>
        <div className={styles.tabToolbar}>
          <button
            className={styles.benchBtn}
            onClick={benchmarkAll}
            disabled={running.size > 0}
          >
            {running.size === chains.length ? (
                <>
                    Benchmark All
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.spin}>
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                </>
            ) : (
                <>
                    Benchmark All
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                </>
            )}
          </button>
        </div>

      <div className={styles.chains}>
        {chains.map((chain) => (
          <div key={chain.id} className={styles.chainCard}>
            <div className={styles.chainHeader}>
              <div className={styles.chainInfo}>
                <div className={styles.chainIcon}>{chain.symbol[0]}</div>
                <div>
                  <div className={styles.chainName}>{chain.name}</div>
                  <div className={styles.chainId}>Chain ID: {chain.id}</div>
                </div>
              </div>
              <button
                className={styles.benchBtn}
                onClick={() => benchmarkChain(chain.id)}
                disabled={running.has(chain.id)}
              >
                {running.has(chain.id) ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.spin}>
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                )}
              </button>
            </div>

            <div className={styles.rpcList}>
              {chain.rpcs.map((rpc, i) => (
                <div key={rpc.url} className={styles.rpcRow}>
                  <span className={styles.rpcRank}>{i + 1}</span>
                  <span className={`${styles.rpcStatus} ${styles[rpc.status]}`} />
                  <span className={styles.rpcUrl}>{rpc.url.replace(/^https?:\/\//, '')}</span>
                  <span className={styles.rpcBlock}>
                    {rpc.blockHeight !== null ? `#${rpc.blockHeight.toLocaleString()}` : ''}
                  </span>
                  <span className={`${styles.rpcLatency} ${getLatencyClass(rpc.latency)}`}>
                    {rpc.latency === null
                      ? ''
                      : rpc.latency < 0
                        ? 'Error'
                        : `${rpc.latency}ms`}
                  </span>
                  <button
                    className={styles.removeBtn}
                    onClick={() => removeRpc(chain.id, rpc.url)}
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className={styles.addRpc}>
              <input
                className={styles.addInput}
                placeholder="https://custom-rpc-url..."
                value={newRpcInputs[chain.id] || ''}
                onChange={(e) => setNewRpcInputs((prev) => ({ ...prev, [chain.id]: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && addRpc(chain.id)}
              />
              <button className={styles.addBtn} onClick={() => addRpc(chain.id)}>
                + Add
              </button>
            </div>
          </div>
        ))}
      </div>
      </div>
      )}

      {activeTab === 'mempool' && (
      <div className={styles.tabContent}>
        <div className={styles.tabToolbar}>
          <button
            className={styles.benchBtn}
            onClick={mempoolPolling ? stopMempoolPolling : startMempoolPolling}
          >
            {mempoolPolling ? (
              <>
                Stop
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.spin}>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              </>
            ) : (
              <>
                Start Polling
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </>
            )}
          </button>
          {mempoolHistory.length > 0 && (
            <button className={styles.resetBtn} onClick={resetMempool}>Reset</button>
          )}
        </div>

        {/* Summary stats */}
        {mempoolHistory.length > 0 && (
          <div className={styles.mempoolStats}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Total Unique Txs</span>
              <span className={styles.statValue}>{allSeenTxs.size.toLocaleString()}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Polls</span>
              <span className={styles.statValue}>{mempoolHistory.length}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>New Txs (last poll)</span>
              <span className={styles.statValue}>{mempoolHistory.at(-1)?.newTxsDiscovered ?? 0}</span>
            </div>
          </div>
        )}

        {/* RPC Leaderboard */}
        <div className={styles.mempoolCard}>
          <div className={styles.mempoolHeader}>
            <span className={styles.mempoolLabel}>Discovery Leaderboard</span>
            <span className={styles.mempoolSublabel}>Which RPC sees new txs first</span>
          </div>

          <div className={styles.mempoolList}>
            <div className={styles.mempoolRowHeader}>
              <span></span>
              <span>RPC</span>
              <span>First Seen</span>
              <span>Coverage</span>
              <span>Avg Response</span>
              <span></span>
            </div>
            {[...mempoolRpcs]
              .sort((a, b) => b.firstSeenCount - a.firstSeenCount)
              .map((rpc, i) => {
                const coverage = allSeenTxs.size > 0
                  ? Math.round((rpc.uniqueTxs.size / allSeenTxs.size) * 100)
                  : 0;
                return (
                  <div key={rpc.url} className={styles.mempoolRow}>
                    <span className={styles.mempoolRank}>
                      {i === 0 && rpc.firstSeenCount > 0 ? '🥇' : i === 1 && rpc.firstSeenCount > 0 ? '🥈' : `#${i + 1}`}
                    </span>
                    <span className={styles.mempoolRpcLabel}>{rpc.label}</span>
                    <span className={styles.mempoolFirstSeen}>
                      {rpc.firstSeenCount > 0 ? (
                        <><strong>{rpc.firstSeenCount}</strong> txs</>
                      ) : '—'}
                    </span>
                    <span className={styles.mempoolCoverage}>
                      {coverage > 0 ? (
                        <span className={`${styles.coverageBar}`}>
                          <span className={styles.coverageFill} style={{ width: `${coverage}%` }} />
                          <span className={styles.coverageText}>{coverage}%</span>
                        </span>
                      ) : '—'}
                    </span>
                    <span className={`${styles.mempoolResponseTime} ${rpc.avgResponseTime < 500 ? styles.fast : rpc.avgResponseTime < 1500 ? styles.medium : styles.slow}`}>
                      {rpc.avgResponseTime > 0 ? `${rpc.avgResponseTime}ms` : '—'}
                    </span>
                    <button
                      className={styles.removeBtn}
                      onClick={() => removeMempoolRpc(rpc.url)}
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
          </div>

          <div className={styles.addRpc}>
            <input
              className={styles.addInput}
              placeholder="https://custom-rpc-url..."
              value={newMempoolRpc}
              onChange={(e) => setNewMempoolRpc(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addMempoolRpc()}
            />
            <button className={styles.addBtn} onClick={addMempoolRpc}>
              + Add
            </button>
          </div>
        </div>

        {/* Live feed */}
        {mempoolHistory.length > 0 && (
          <div className={styles.mempoolCard}>
            <div className={styles.mempoolHeader}>
              <span className={styles.mempoolLabel}>Live Feed</span>
            </div>
            <div className={styles.mempoolFeed}>
              {mempoolHistory.slice(-8).reverse().map((entry) => (
                <div key={entry.time} className={styles.feedRow}>
                  <span className={styles.feedTime}>
                    {new Date(entry.time).toLocaleTimeString()}
                  </span>
                  <span className={styles.feedNew}>
                    +{entry.newTxsDiscovered} new
                  </span>
                  <span className={styles.feedDetails}>
                    {entry.rpcResults.map(r => {
                      const rpc = mempoolRpcs.find(m => m.url === r.url);
                      return rpc ? `${rpc.label}: ${r.newTxs.length}` : null;
                    }).filter(Boolean).join(' · ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
