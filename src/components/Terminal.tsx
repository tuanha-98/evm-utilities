'use client';

import React, { useEffect, useRef } from 'react';
import '@xterm/xterm/css/xterm.css'; // Just in case, though nextjs might complain about global css import here. 
// Usually better to import css in globals or layout. We will handle that.

interface TerminalProps {
    output: string; // We might need to change this API to streaming if possible, but the parent uses a string based accumulator.
    // Ideally the parent should pass a stream or we expose a method to write to terminal.
    // For now, let's detect *changes* in output and write the diff? 
    // Or better, let the parent pass the latest chunk?
    // The current architecture passes full `terminalOutput`.
    // If we switch to xterm, we need to append only.
    // Let's change the specific prop to be "lastChunk" or similar, or just handle the diff?
    // Diffing string is expensive.
    // Let's use a ref or an event emitter.
}

// Check parent usage:
// setTerminalOutput(prev => prev + text);
// <Terminal output={terminalOutput} ... />

// We should probably change the pattern in page.tsx to not accumulate state if we use xterm, 
// but xterm maintains its own buffer. 
// So we can just pass the "stream" data directly.

export default function Terminal({ data }: { data: string | null }) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<any>(null);
  const fitAddonRef = useRef<any>(null);

  useEffect(() => {
    const initTerminal = async () => {
        if (!terminalRef.current || xtermRef.current) return;

        const { Terminal } = await import('@xterm/xterm');
        const { FitAddon } = await import('@xterm/addon-fit');

        const term = new Terminal({
            theme: {
                background: '#0a0a0a',
                foreground: '#ffffff',
                cursor: 'transparent',
                selectionBackground: 'rgba(0, 212, 255, 0.3)',
            },
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
            fontSize: 12,
            lineHeight: 1.2,
            cursorBlink: false,
            convertEol: true, // Treat \n as \r\n
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        
        term.open(terminalRef.current);
        fitAddon.fit();

        xtermRef.current = term;
        fitAddonRef.current = fitAddon;

        // Resize observer
        const resizeObserver = new ResizeObserver(() => {
            fitAddon.fit();
        });
        resizeObserver.observe(terminalRef.current);
        
        return () => {
            resizeObserver.disconnect();
            term.dispose();
        };
    };

    initTerminal();
  }, []);

  useEffect(() => {
    if (xtermRef.current && data) {
        xtermRef.current.write(data);
    }
  }, [data]);

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-[#1e1e1e] shadow-sm">
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
          <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
        </div>
      </div>
      
      <div className="flex-1 w-full h-full" ref={terminalRef} />
    </div>
  );
}
