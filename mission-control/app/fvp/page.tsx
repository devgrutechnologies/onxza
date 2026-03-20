/**
 * FVP Loop Tracker — ONXZA Mission Control
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */
'use client';

import { useEffect, useState } from 'react';

interface FvpRow {
  agent: string;
  totalDispatches: number;
  uniqueTickets: number;
  loopsDetected: number;
  lastDispatch: string;
}

export default function FvpPage() {
  const [data, setData] = useState<FvpRow[]>([]);

  useEffect(() => {
    fetch('/api/fvp').then((r) => r.json()).then((d) => setData(d.fvpData || [])).catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">FVP Loop Tracker</h1>
      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-xs">
              <th className="text-left p-3">Agent</th>
              <th className="text-right p-3">Total Dispatches</th>
              <th className="text-right p-3">Unique Tickets</th>
              <th className="text-right p-3">Loops Detected</th>
              <th className="text-left p-3">Last Dispatch</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={row.agent}
                className={`border-b border-gray-800/50 hover:bg-gray-800/30 ${row.loopsDetected > 2 ? 'bg-red-950/30' : ''}`}
              >
                <td className="p-3 font-mono text-xs text-cyan-400">{row.agent}</td>
                <td className="p-3 text-xs text-right">{row.totalDispatches}</td>
                <td className="p-3 text-xs text-right">{row.uniqueTickets}</td>
                <td className="p-3 text-xs text-right">
                  <span className={row.loopsDetected > 2 ? 'text-red-400 font-bold' : row.loopsDetected > 0 ? 'text-yellow-400' : 'text-gray-400'}>
                    {row.loopsDetected}
                  </span>
                </td>
                <td className="p-3 font-mono text-xs text-gray-400">
                  {row.lastDispatch ? row.lastDispatch.slice(0, 19).replace('T', ' ') : '—'}
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr><td colSpan={5} className="p-4 text-center text-gray-500">No dispatch data</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
