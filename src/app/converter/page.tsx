'use client';

import { useState } from 'react';
import BigNumber from 'bignumber.js';
import { message } from 'antd';
import styles from './converter.module.scss';

const UNITS = [
  { name: 'Wei', factor: 0 },
  { name: 'Gwei', factor: 9 },
  { name: 'Ether', factor: 18 },
];

const PANIC_CODES: Record<number, string> = {
  0x00: 'Generic compiler panic',
  0x01: 'Assert condition failed',
  0x11: 'Arithmetic overflow/underflow',
  0x12: 'Division or modulo by zero',
  0x21: 'Conversion to invalid enum value',
  0x22: 'Incorrectly encoded storage byte array',
  0x31: 'Pop on empty array',
  0x32: 'Array index out of bounds',
  0x41: 'Too much memory allocated',
  0x51: 'Called zero-initialized function',
};

function hexToString(hex: string): string {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (clean.length < 2 || clean.length % 2 !== 0) return '';

  const selector = clean.slice(0, 8);

  // Error(string) — selector 08c379a0
  if (selector === '08c379a0' && clean.length >= 8 + 64 + 64) {
    const dataHex = clean.slice(8);
    const lengthHex = dataHex.slice(64, 128);
    const strLength = parseInt(lengthHex, 16);
    if (!isNaN(strLength) && strLength > 0 && strLength < 10000) {
      const strHex = dataHex.slice(128, 128 + strLength * 2);
      return `Error: ${decodeHexBytes(strHex)}`;
    }
  }

  // Panic(uint256) — selector 4e487b71
  if (selector === '4e487b71' && clean.length >= 8 + 64) {
    const codeHex = clean.slice(8, 72);
    const code = parseInt(codeHex, 16);
    const description = PANIC_CODES[code] || `Unknown panic code`;
    return `Panic(0x${code.toString(16).padStart(2, '0')}): ${description}`;
  }

  // Custom error — has a 4-byte selector but not Error/Panic
  // if (clean.length >= 8 && /^[0-9a-fA-F]{8}/.test(clean)) {
  //   // Try to decode remaining data as raw string (best-effort)
  //   const rawDecode = decodeHexBytes(clean.slice(8));
  //   if (rawDecode && /^[\x20-\x7e]+$/.test(rawDecode)) {
  //     return `Custom Error (0x${selector}): ${rawDecode}`;
  //   }
  //   return `Custom Error (0x${selector})`;
  // }

  // Detect any ABI-encoded string (starts with offset 0x20 = 32)
  if (clean.length >= 128 && clean.startsWith('0000000000000000000000000000000000000000000000000000000000000020')) {
    const lengthHex = clean.slice(64, 128);
    const strLength = parseInt(lengthHex, 16);
    if (!isNaN(strLength) && strLength > 0 && strLength < 10000) {
      const strHex = clean.slice(128, 128 + strLength * 2);
      return decodeHexBytes(strHex);
    }
  }

  // Fallback: raw hex to string
  return decodeHexBytes(clean);
}

function decodeHexBytes(hex: string): string {
  const bytes = [];
  for (let i = 0; i < hex.length; i += 2) {
    const byte = parseInt(hex.substring(i, i + 2), 16);
    if (isNaN(byte)) return '';
    if (byte === 0) continue; // skip null padding
    bytes.push(byte);
  }
  try {
    return new TextDecoder().decode(new Uint8Array(bytes));
  } catch {
    return '';
  }
}

function stringToHex(str: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  return '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

type Tab = 'units' | 'bytes';

export default function Converter() {
  const [activeTab, setActiveTab] = useState<Tab>('units');
  const [weiValue, setWeiValue] = useState<string>('1000000000');
  const [bytesInput, setBytesInput] = useState<string>('');
  const [stringOutput, setStringOutput] = useState<string>('');

  const handleInputChange = (value: string, factor: number) => {
    if (!value) { setWeiValue(''); return; }
    const cleanValue = value.replace(/[^0-9.-]/g, '');
    try {
      const bn = new BigNumber(cleanValue);
      if (bn.isNaN()) return;
      setWeiValue(bn.multipliedBy(new BigNumber(10).pow(factor)).toFixed());
    } catch { /* ignore */ }
  };

  const calculateValue = (factor: number): string => {
    if (!weiValue) return '';
    try {
      return new BigNumber(weiValue).dividedBy(new BigNumber(10).pow(factor)).toFixed();
    } catch { return ''; }
  };

  const copy = (text: string) => {
    if (text) {
      navigator.clipboard.writeText(text);
      message.success('Copied');
    }
  };

  const CopyIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Converter</h1>
          <p className={styles.subtitle}>Convert between Wei, Gwei, Ether and decode hex bytes.</p>
        </div>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'units' ? styles.active : ''}`}
            onClick={() => setActiveTab('units')}
          >
            Wei ⇄ Ether
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'bytes' ? styles.active : ''}`}
            onClick={() => setActiveTab('bytes')}
          >
            Bytes → String
          </button>
        </div>

        <div className={styles.card}>
          {activeTab === 'units' ? (
            <div className={styles.fields}>
              {UNITS.map((unit) => (
                <div key={unit.name} className={styles.field}>
                  <label className={styles.label}>{unit.name}</label>
                  <div className={styles.inputRow}>
                    <input
                      className={styles.input}
                      value={calculateValue(unit.factor)}
                      onChange={(e) => handleInputChange(e.target.value, unit.factor)}
                      placeholder={`0`}
                    />
                    <button className={styles.copyBtn} onClick={() => copy(calculateValue(unit.factor))} title="Copy">
                      <CopyIcon />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.fields}>
              <div className={styles.field}>
                <label className={styles.label}>Hex Bytes</label>
                <textarea
                  className={styles.textarea}
                  value={bytesInput}
                  onChange={(e) => {
                    setBytesInput(e.target.value);
                    setStringOutput(hexToString(e.target.value.trim()));
                  }}
                  placeholder="0x4572726f723a20696e73756666696369656e742062616c616e6365"
                  rows={3}
                />
              </div>

              <div className={styles.arrow}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12l7 7 7-7" />
                </svg>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Decoded String</label>
                <div className={styles.inputRow}>
                  <input
                    className={styles.input}
                    value={stringOutput}
                    onChange={(e) => {
                      setStringOutput(e.target.value);
                      setBytesInput(stringToHex(e.target.value));
                    }}
                    placeholder="Human readable text"
                  />
                  <button className={styles.copyBtn} onClick={() => copy(stringOutput)} title="Copy">
                    <CopyIcon />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
