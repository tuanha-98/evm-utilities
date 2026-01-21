'use client';

import { useState, useEffect } from 'react';
import TraceInput from '@/components/TraceInput';
import SimulateInput from '@/components/SimulateInput';
import Terminal from '@/components/Terminal';
import { generateSimulationTest } from '@/lib/templates';

type Tab = 'TRACE' | 'SIMULATE';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('TRACE');
  const [isRunning, setIsRunning] = useState(false);
  const [latestOutput, setLatestOutput] = useState<string | null>(null);

  // Trace State
  const [rpcUrl, setRpcUrl] = useState('');
  const [txHash, setTxHash] = useState('');

  // Simulate State
  const [sender, setSender] = useState('');
  const [shouldDealToken, setShouldDealToken] = useState(false);
  const [tokenAddress, setTokenAddress] = useState('');
  const [spender, setSpender] = useState('');
  const [amount, setAmount] = useState('0');
  const [calldata, setCalldata] = useState('');
  const [to, setTo] = useState('');
  const [msgValue, setMsgValue] = useState('0');

  const [scriptContent, setScriptContent] = useState('');

  useEffect(() => {
    setLatestOutput('\x1b[2J\x1b[3J\x1b[H');
  }, [activeTab]);

  // Update script preview when inputs change
  useEffect(() => {
    if (activeTab === 'SIMULATE') {
      const content = generateSimulationTest({
        rpcUrl,
        sender,
        to,
        calldata,
        amount,
        msgValue,
        shouldDealToken,
        tokenAddress,
        spender
      });
      setScriptContent(content);
    }
  }, [activeTab, sender, shouldDealToken, tokenAddress, spender, amount, calldata, to, msgValue, rpcUrl, txHash]);

  const handleRun = async () => {
    setIsRunning(true);
    // Clear previous or init
    setLatestOutput('\x1b[2J\x1b[3J\x1b[H'); // Clear screen
    
    try {
      const response = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeTab,
          inputs: { 
            rpcUrl, txHash, sender, shouldDealToken, 
            tokenAddress, spender, amount, calldata, to, msgValue, scriptContent 
          }
        })
      });

      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        setLatestOutput(text); // Pass the chunk directly
      }
    } catch (error) {
      setLatestOutput(`\r\nError: ${error}\r\n`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <main>
      <div style={{marginBottom: '10px'}}>
        <div className="flex space-x-2">
          <button 
            className={`tab-btn mr-4 ${activeTab === 'TRACE' ? 'active shadow-sm' : 'hover:bg-gray-100'}`}
            onClick={() => setActiveTab('TRACE')}
          >
            Trace Transaction
          </button>
          <button 
            className={`tab-btn ${activeTab === 'SIMULATE' ? 'active shadow-sm' : 'hover:bg-gray-100'}`}
            onClick={() => setActiveTab('SIMULATE')}
          >
            Simulate Transaction
          </button>
        </div>
      </div>

      <div>
        {/* Left Column: Inputs & Controls */}
        <div className="glass-panel">
          <div>
            {activeTab === 'TRACE' ? (
              <TraceInput 
                rpcUrl={rpcUrl} setRpcUrl={setRpcUrl}
                txHash={txHash} setTxHash={setTxHash}
              />
            ) : (
              <SimulateInput 
                rpcUrl={rpcUrl} setRpcUrl={setRpcUrl}
                sender={sender} setSender={setSender}
                shouldDealToken={shouldDealToken} setShouldDealToken={setShouldDealToken}
                tokenAddress={tokenAddress} setTokenAddress={setTokenAddress}
                spender={spender} setSpender={setSpender}
                amount={amount} setAmount={setAmount}
                calldata={calldata} setCalldata={setCalldata}
                to={to} setTo={setTo}
                msgValue={msgValue} setMsgValue={setMsgValue}
              />
            )}

          </div>
        </div>
        
        <div className="glass-panel">
          <button 
            className="btn-primary w-full text-md shadow-lg shadow-primary/20 hover:shadow-primary/40 p-4 rounded-xl"
            onClick={handleRun}
            disabled={isRunning}
          >
            {isRunning ? 'Processing...' : 'Run'}
          </button>
        </div>

        {/* Right Column: Terminal */}
        <div className="terminal-container">
          <Terminal data={latestOutput} />
        </div>
      </div>
    </main>
  );
}
