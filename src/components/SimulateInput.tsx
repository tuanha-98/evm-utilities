import React, { useState } from 'react';

interface SimulateInputProps {
  sender: string;
  setSender: (val: string) => void;
  shouldDealToken: boolean;
  setShouldDealToken: (val: boolean) => void;
  tokenAddress: string;
  setTokenAddress: (val: string) => void;
  spender: string;
  setSpender: (val: string) => void;
  amount: string;
  setAmount: (val: string) => void;
  calldata: string;
  setCalldata: (val: string) => void;
  to: string;
  setTo: (val: string) => void;
  msgValue: string;
  setMsgValue: (val: string) => void;
  rpcUrl: string;
  setRpcUrl: (val: string) => void;
}

export default function SimulateInput({
  sender,
  setSender,
  shouldDealToken,
  setShouldDealToken,
  tokenAddress,
  setTokenAddress,
  spender,
  setSpender,
  amount,
  setAmount,
  calldata,
  setCalldata,
  to,
  setTo,
  msgValue,
  setMsgValue,
  rpcUrl,
  setRpcUrl,
}: SimulateInputProps) {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="input-group md:col-span-2">
          <label className="input-label">RPC URL (Required for fork)</label>
          <input 
            type="text" 
            className="input-field" 
            placeholder="https://eth-mainnet.alchemyapi.io/v2/..."
            value={rpcUrl}
            onChange={(e) => setRpcUrl(e.target.value)}
          />
        </div>
        <div className="input-group">
          <label className="input-label">Sender</label>
          <input 
            type="text" 
            className="input-field" 
            placeholder="0x..."
            value={sender}
            onChange={(e) => setSender(e.target.value)}
          />
        </div>
        <div className="input-group">
          <label className="input-label">Target (To)</label>
          <input 
            type="text" 
            className="input-field" 
            placeholder="0x..."
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
      </div>

      <div className="input-group flex items-center gap-2">
        <label className="checkbox-label checkbox-inline">
          <input
            type="checkbox"
            checked={shouldDealToken}
            onChange={(e) => setShouldDealToken(e.target.checked)}
          />
          Approve
        </label>
      </div>

      {shouldDealToken && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-down">
          <div className="input-group">
            <label className="input-label">Token</label>
            <div className="">
              <input 
                type="text" 
                className="input-field" 
                placeholder="0x..."
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
              />
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">Amount (wei/units)</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="1000000000000000000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="input-group md:col-span-2">
            <label className="input-label">Spender (Approved Address)</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="0x..."
              value={spender}
              onChange={(e) => setSpender(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="input-group">
        <label className="input-label">Value (ETH)</label>
        <input 
          type="text" 
          className="input-field" 
          placeholder="0"
          value={msgValue}
          onChange={(e) => setMsgValue(e.target.value)}
        />
      </div>

      <div className="input-group">
        <label className="input-label">Calldata</label>
        <textarea 
          className="input-field font-mono text-sm" 
          rows={4}
          placeholder="0x..."
          value={calldata}
          onChange={(e) => setCalldata(e.target.value)}
        />
      </div>
    </div>
  );
}
