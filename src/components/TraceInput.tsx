import React from 'react';

interface TraceInputProps {
  rpcUrl: string;
  setRpcUrl: (val: string) => void;
  txHash: string;
  setTxHash: (val: string) => void;
}

export default function TraceInput({
  rpcUrl,
  setRpcUrl,
  txHash,
  setTxHash,
}: TraceInputProps) {
  return (
    <div className="glass-panel p-6 animate-fade-in space-y-6">
      <div className="input-group">
        <label className="input-label">RPC URL</label>
        <input 
          type="text" 
          className="input-field" 
          placeholder="https://eth-mainnet.alchemyapi.io/v2/..."
          value={rpcUrl}
          onChange={(e) => setRpcUrl(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="input-group">
          <label className="input-label">Transaction Hash</label>
          <input 
            type="text" 
            className="input-field" 
            placeholder="0x..."
            value={txHash}
            onChange={(e) => setTxHash(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
