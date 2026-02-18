'use client';

import { useState } from 'react';
import { Card, Input, message, Tooltip } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import BigNumber from 'bignumber.js';
import './converter.css';

// Configuration for units
const UNITS = [
  { name: 'Wei', factor: 0 },
  { name: 'Gwei', factor: 9 },
  { name: 'Ether', factor: 18 },
];

export default function Converter() {
  // We store the master value in Wei as a string to handle large numbers
  const [weiValue, setWeiValue] = useState<string>('1000000000');

  const handleInputChange = (value: string, factor: number) => {
    if (!value) {
      setWeiValue('');
      return;
    }

    // Remove commas for calculation? Or assume input is clean number/decimals
    // Let's just strip non-numeric except . and - (though eth is usually positive)
    const cleanValue = value.replace(/[^0-9.-]/g, '');
    
    try {
      const bn = new BigNumber(cleanValue);
      if (bn.isNaN()) return;

      // Convert input to Wei
      // value * 10^factor = wei
      // e.g. 1 Ether (factor 18) = 1 * 10^18 Wei
      const wei = bn.multipliedBy(new BigNumber(10).pow(factor));
      setWeiValue(wei.toFixed());
    } catch (e) {
      // ignore invalid input
    }
  };

  const calculateValue = (factor: number): string => {
    if (!weiValue) return '';
    try {
      const wei = new BigNumber(weiValue);
      // wei / 10^factor = value
      const val = wei.dividedBy(new BigNumber(10).pow(factor));
      
      // Format with no exponential notation for readability if possible, 
      // but BigNumber toFixed() does this well.
      return val.toFixed(); 
    } catch {
      return '';
    }
  };

  return (
    <div className="converter-container">
      <div className="converter-card">
        <div className="converter-header">
          <div className="traffic-light traffic-red" />
          <div className="traffic-light traffic-yellow" />
          <div className="traffic-light traffic-green" />
        </div>
        
        <div className="converter-body">
          {UNITS.map((unit) => (
            <div key={unit.name} className="unit-row">
              <div className="unit-label">
                {unit.name}
              </div>
              <div className="unit-input-wrapper">
                <Input
                  className="unit-input"
                  value={calculateValue(unit.factor)}
                  onChange={(e) => handleInputChange(e.target.value, unit.factor)}
                  placeholder={`Amount in ${unit.name}`}
                  suffix={
                    <Tooltip title="Copy value">
                      <CopyOutlined 
                        style={{ color: '#858585', cursor: 'pointer' }} 
                        onClick={() => {
                          const v = calculateValue(unit.factor);
                          if(v) {
                            navigator.clipboard.writeText(v);
                            message.success('Copied!');
                          }
                        }}
                      />
                    </Tooltip>
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
