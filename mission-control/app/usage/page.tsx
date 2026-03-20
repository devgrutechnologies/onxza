/**
 * Model Usage & Cost Tracker — ONXZA Mission Control
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */
'use client';

import { useEffect, useState } from 'react';

interface UsageData {
  stats: {
    totalCostToday: string;
    totalTokens: number;
    apiCalls: number;
    uniqueAgents: number;
  };
  modelCosts: Record<string, number>;
  agentTable: {
    agent: string;
    model: string;
    calls: number;
    tokensIn: number;
    tokensOut: number;
    cost: number;
  }[];
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

export default function UsagePage() {
  const [data, setData] = useState<UsageData | null>(null);

  useEffect(() => {
    fetch('/api/usage').then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  if (!data) return <div className="text-gray-500">Loading usage data...</div>;

  const maxModelCost = Math.max(...Object.values(data.modelCosts), 0.01);

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Model Usage & Cost Tracker</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
          <div className="text-2xl font-bold text-green-400">${data.stats.totalCostToday}</div>
          <div className="text-xs text-gray-400 mt-1">Total Cost Today</div>
        </div>
        <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
          <div className="text-2xl font-bold text-cyan-400">{formatNum(data.stats.totalTokens)}</div>
          <div className="text-xs text-gray-400 mt-1">Total Tokens</div>
        </div>
        <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
          <div className="text-2xl font-bold text-purple-400">{data.stats.apiCalls}</div>
          <div className="text-xs text-gray-400 mt-1">API Calls</div>
        </div>
        <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
          <div className="text-2xl font-bold text-yellow-400">{data.stats.uniqueAgents}</div>
          <div className="text-xs text-gray-400 mt-1">Unique Agents</div>
        </div>
      </div>

      {/* Bar Chart */}
      {Object.keys(data.modelCosts).length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-bold text-gray-300 mb-3 uppercase tracking-wider">Cost per Model</h2>
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 space-y-3">
            {Object.entries(data.modelCosts).sort(([, a], [, b]) => b - a).map(([model, cost]) => (
              <div key={model} className="flex items-center gap-3">
                <span className="w-32 text-xs font-mono text-gray-400 truncate">{model}</span>
                <div className="flex-1 bg-gray-800 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-full bg-cyan-600 rounded-full"
                    style={{ width: `${(cost / maxModelCost) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-gray-300 w-20 text-right">${cost.toFixed(4)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agent Table */}
      <h2 className="text-sm font-bold text-gray-300 mb-3 uppercase tracking-wider">Agent Usage</h2>
      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-xs">
              <th className="text-left p-3">Agent</th>
              <th className="text-left p-3">Model</th>
              <th className="text-right p-3">Calls</th>
              <th className="text-right p-3">Tokens In</th>
              <th className="text-right p-3">Tokens Out</th>
              <th className="text-right p-3">Cost</th>
            </tr>
          </thead>
          <tbody>
            {data.agentTable.map((row) => (
              <tr key={row.agent} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="p-3 font-mono text-xs text-cyan-400">{row.agent}</td>
                <td className="p-3 font-mono text-xs text-gray-400">{row.model}</td>
                <td className="p-3 text-xs text-right">{row.calls}</td>
                <td className="p-3 text-xs text-right text-gray-400">{formatNum(row.tokensIn)}</td>
                <td className="p-3 text-xs text-right text-gray-400">{formatNum(row.tokensOut)}</td>
                <td className="p-3 text-xs text-right text-green-400">${row.cost.toFixed(4)}</td>
              </tr>
            ))}
            {data.agentTable.length === 0 && (
              <tr><td colSpan={6} className="p-4 text-center text-gray-500">No usage data for today</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
