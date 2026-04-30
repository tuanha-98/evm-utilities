'use client';

import { useState, useCallback } from 'react';
import styles from './benchmark.module.scss';

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

export default function RpcBenchmark() {
  const [chains, setChains] = useState<Chain[]>(DEFAULT_CHAINS);
  const [running, setRunning] = useState<Set<number>>(new Set());
  const [newRpcInputs, setNewRpcInputs] = useState<Record<number, string>>({});

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

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>RPC Benchmark</h1>
        <p className={styles.subtitle}>
          Measure latency to public RPC endpoints. Lower is better.
        </p>
        <button
          className={styles.benchBtn}
          onClick={benchmarkAll}
          disabled={running.size > 0}
          style={{ marginTop: '12px' }}
        >
          {running.size > 0 ? 'Testing...' : 'Benchmark All'}
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
                {running.has(chain.id) ? 'Testing...' : 'Test'}
              </button>
            </div>

            <div className={styles.rpcList}>
              {chain.rpcs.map((rpc, i) => (
                <div key={rpc.url} className={styles.rpcRow}>
                  <span className={styles.rpcRank}>{i + 1}</span>
                  <span className={`${styles.rpcStatus} ${styles[rpc.status]}`} />
                  <span className={styles.rpcUrl}>{rpc.url.replace(/^https?:\/\//, '')}</span>
                  <span className={styles.rpcBlock}>
                    {rpc.blockHeight !== null ? `#${rpc.blockHeight.toLocaleString()}` : '—'}
                  </span>
                  <span className={`${styles.rpcLatency} ${getLatencyClass(rpc.latency)}`}>
                    {rpc.latency === null
                      ? '—'
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
  );
}
