'use client';

import { useState, useEffect, useRef } from 'react';
import { TraceFields, SimulateFields } from '@/components/FormFields';
import Terminal, { TerminalHandle } from '@/components/Terminal';
import { generateSimulationTest } from '@/lib/templates';
import styles from './simulator.module.scss';

type Tab = 'TRACE' | 'SIMULATE';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('TRACE');
  const [isRunning, setIsRunning] = useState(false);
  const terminalRef = useRef<TerminalHandle>(null);

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
  const [shouldForkBlock, setShouldForkBlock] = useState(false);
  const [blockNumber, setBlockNumber] = useState('0');

  const [scriptContent, setScriptContent] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const startTimeRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      startTimeRef.current = Date.now();
      setElapsedTime(0);
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTimeRef.current);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const decimal = Math.floor((ms % 1000) / 100);
    return `${seconds}.${decimal}s`;
  };

  useEffect(() => {
    terminalRef.current?.clear();
    terminalRef.current?.write('\x1b[2J\x1b[3J\x1b[H');
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'SIMULATE') {
      const content = generateSimulationTest({
        rpcUrl, sender, to, calldata, amount, msgValue, blockNumber,
        shouldDealToken, tokenAddress, spender,
      });
      setScriptContent(content);
    }
  }, [activeTab, sender, shouldDealToken, tokenAddress, spender, amount, calldata, to, msgValue, rpcUrl]);

  const handleRun = async () => {
    if (isRunning) return;
    setIsRunning(true);
    terminalRef.current?.clear();
    terminalRef.current?.write('\x1b[2J\x1b[3J\x1b[H');

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeTab,
          inputs: {
            rpcUrl, txHash, sender, shouldDealToken,
            tokenAddress, spender, amount, calldata, to, msgValue, scriptContent,
          },
        }),
        signal: controller.signal,
      });

      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        terminalRef.current?.write(decoder.decode(value));
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        terminalRef.current?.write('\x1b[31mCancelled.\x1b[0m\n');
      } else {
        terminalRef.current?.write(`\r\nError: ${error}\r\n`);
      }
    } finally {
      setIsRunning(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancel = () => {
    abortControllerRef.current?.abort();
  };

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'TRACE' ? styles.active : ''}`}
            onClick={() => setActiveTab('TRACE')}
          >
            Trace
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'SIMULATE' ? styles.active : ''}`}
            onClick={() => setActiveTab('SIMULATE')}
          >
            Simulate
          </button>
        </div>
        {isRunning && <span className={styles.timer}>{formatTime(elapsedTime)}</span>}
      </div>

      <div className={styles.workspace}>
        <div className={styles.inputPanel}>
          {activeTab === 'TRACE' ? (
            <TraceFields
              rpcUrl={rpcUrl} setRpcUrl={setRpcUrl}
              txHash={txHash} setTxHash={setTxHash}
            />
          ) : (
            <SimulateFields
              rpcUrl={rpcUrl} setRpcUrl={setRpcUrl}
              sender={sender} setSender={setSender}
              shouldDealToken={shouldDealToken} setShouldDealToken={setShouldDealToken}
              tokenAddress={tokenAddress} setTokenAddress={setTokenAddress}
              spender={spender} setSpender={setSpender}
              amount={amount} setAmount={setAmount}
              calldata={calldata} setCalldata={setCalldata}
              to={to} setTo={setTo}
              msgValue={msgValue} setMsgValue={setMsgValue}
              shouldForkBlock={shouldForkBlock} setShouldForkBlock={setShouldForkBlock}
              blockNumber={blockNumber} setBlockNumber={setBlockNumber}
            />
          )}

          <div className={styles.actions}>
            <button
              className={styles.runBtn}
              onClick={handleRun}
              disabled={isRunning}
            >
              {isRunning ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.spin}>
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </>
              )}
            </button>
            {isRunning && (
              <button className={styles.cancelBtn} onClick={handleCancel} title="Cancel">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className={styles.outputPanel}>
          <Terminal ref={terminalRef} />
        </div>
      </div>
    </div>
  );
}
