/**
 * Model Usage & Cost Tracker — ONXZA Mission Control
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 * Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
 */
'use client';

import { useEffect, useState, useCallback } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

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

interface ModelStats {
  total_calls: number;
  fvp_pass_rate: number;
  fvp_fail_rate: number;
  avg_loops: number;
  avg_time_ms: number;
  avg_cost_usd: number;
  total_cost_usd: number;
  avg_confidence: number;
  cost_efficiency: number;
  top_task_types: [string, number][];
}

interface MpiReport {
  total: number;
  models: number;
  model_stats: Record<string, ModelStats>;
  task_types: { type: string; count: number }[];
  generated_at: string;
}

interface MpiTrends {
  days: string[];
  models: string[];
  series: { model: string; data: (number | null)[] }[];
  generated_at: string;
}

interface ComparisonData {
  comparison: Record<string, ModelStats | { error: string }>;
  generated_at: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

function pct(n: number): string {
  return (n * 100).toFixed(1) + '%';
}

function fvpColor(rate: number): string {
  if (rate >= 0.8) return 'text-green-400';
  if (rate >= 0.5) return 'text-yellow-400';
  return 'text-red-400';
}

// ─── Subcomponents ───────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-400 mt-1">{label}</div>
    </div>
  );
}

function BarRow({ label, value, max, color = 'bg-cyan-600' }: { label: string; value: number; max: number; color?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-36 text-xs font-mono text-gray-400 truncate">{label}</span>
      <div className="flex-1 bg-gray-800 rounded-full h-4 overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${Math.min((value / max) * 100, 100)}%` }} />
      </div>
      <span className="text-xs font-mono text-gray-300 w-16 text-right">{value.toFixed(4)}</span>
    </div>
  );
}

function PerformanceRankings({ stats }: { stats: Record<string, ModelStats> }) {
  const sorted = Object.entries(stats).sort(([, a], [, b]) => b.fvp_pass_rate - a.fvp_pass_rate);
  if (sorted.length === 0) return <p className="text-gray-500 text-sm">No MPI data yet.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800 text-gray-400 text-xs">
            <th className="text-left p-2">Model</th>
            <th className="text-right p-2">Calls</th>
            <th className="text-right p-2">FVP Pass</th>
            <th className="text-right p-2">Avg Loops</th>
            <th className="text-right p-2">Avg Conf.</th>
            <th className="text-right p-2">Avg Cost</th>
            <th className="text-right p-2">Tasks/$</th>
            <th className="text-left p-2">Top Types</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(([model, s]) => (
            <tr key={model} className="border-b border-gray-800/50 hover:bg-gray-800/30">
              <td className="p-2 font-mono text-xs text-cyan-400">{model}</td>
              <td className="p-2 text-xs text-right">{s.total_calls}</td>
              <td className={`p-2 text-xs text-right font-bold ${fvpColor(s.fvp_pass_rate)}`}>{pct(s.fvp_pass_rate)}</td>
              <td className="p-2 text-xs text-right text-gray-300">{s.avg_loops.toFixed(1)}</td>
              <td className="p-2 text-xs text-right text-purple-400">{s.avg_confidence}</td>
              <td className="p-2 text-xs text-right text-gray-400">${s.avg_cost_usd.toFixed(5)}</td>
              <td className="p-2 text-xs text-right text-green-400">{s.cost_efficiency}</td>
              <td className="p-2 text-xs text-gray-500">
                {s.top_task_types.map(([t]) => t).join(', ')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FvpTrend({ trends }: { trends: MpiTrends }) {
  if (!trends.days.length) return <p className="text-gray-500 text-sm">No trend data yet.</p>;
  const colors = ['bg-cyan-500', 'bg-purple-500', 'bg-yellow-500', 'bg-green-500', 'bg-red-500'];
  return (
    <div className="space-y-3">
      <div className="flex gap-4 flex-wrap">
        {trends.models.map((m, i) => (
          <div key={m} className="flex items-center gap-1.5 text-xs text-gray-400">
            <div className={`w-3 h-3 rounded-full ${colors[i % colors.length]}`} />
            <span className="font-mono">{m}</span>
          </div>
        ))}
      </div>
      {trends.models.map((model, mi) => {
        const series = trends.series.find(s => s.model === model);
        if (!series) return null;
        return (
          <div key={model} className="flex items-center gap-2">
            <span className="w-28 text-xs font-mono text-gray-400 truncate">{model}</span>
            <div className="flex gap-1 flex-1">
              {series.data.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                  <div
                    className={`w-full rounded-sm ${colors[mi % colors.length]} opacity-80`}
                    style={{ height: `${v !== null ? Math.max(v * 40, 2) : 2}px`, minHeight: 2 }}
                    title={`${trends.days[i]}: ${v !== null ? pct(v) : 'N/A'}`}
                  />
                  {trends.days.length <= 7 && (
                    <span className="text-gray-600 text-[9px]">{trends.days[i]?.slice(5)}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ComparisonWidget({
  models,
  onCompare,
  data
}: {
  models: string[];
  onCompare: (a: string, b: string) => void;
  data: ComparisonData | null;
}) {
  const [modelA, setModelA] = useState('');
  const [modelB, setModelB] = useState('');

  const rows: { label: string; key: keyof ModelStats; fmt: (v: number) => string }[] = [
    { label: 'Total Calls', key: 'total_calls', fmt: String },
    { label: 'FVP Pass Rate', key: 'fvp_pass_rate', fmt: pct },
    { label: 'FVP Fail Rate', key: 'fvp_fail_rate', fmt: pct },
    { label: 'Avg Loops', key: 'avg_loops', fmt: v => v.toFixed(2) },
    { label: 'Avg Time (ms)', key: 'avg_time_ms', fmt: v => v.toFixed(0) },
    { label: 'Avg Cost ($)', key: 'avg_cost_usd', fmt: v => v.toFixed(5) },
    { label: 'Total Cost ($)', key: 'total_cost_usd', fmt: v => v.toFixed(4) },
    { label: 'Avg Confidence', key: 'avg_confidence', fmt: String },
    { label: 'Tasks / $', key: 'cost_efficiency', fmt: String },
  ];

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-300 focus:outline-none"
          value={modelA}
          onChange={e => setModelA(e.target.value)}
        >
          <option value="">Model A…</option>
          {models.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <span className="self-center text-gray-500 text-sm">vs</span>
        <select
          className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-300 focus:outline-none"
          value={modelB}
          onChange={e => setModelB(e.target.value)}
        >
          <option value="">Model B…</option>
          {models.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <button
          onClick={() => modelA && modelB && onCompare(modelA, modelB)}
          disabled={!modelA || !modelB}
          className="px-4 py-1.5 text-sm bg-cyan-700 hover:bg-cyan-600 disabled:opacity-40 rounded text-white"
        >
          Compare
        </button>
      </div>
      {data && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-xs">
                <th className="text-left p-2">Metric</th>
                {Object.keys(data.comparison).map(m => (
                  <th key={m} className="text-right p-2 font-mono text-cyan-400">{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.key} className="border-b border-gray-800/50">
                  <td className="p-2 text-xs text-gray-400">{row.label}</td>
                  {Object.entries(data.comparison).map(([m, s]) => {
                    if ('error' in s) return <td key={m} className="p-2 text-xs text-right text-red-400">N/A</td>;
                    const val = s[row.key] as number;
                    return <td key={m} className="p-2 text-xs text-right text-gray-200">{row.fmt(val)}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!data && <p className="text-gray-500 text-sm">Select two models and click Compare.</p>}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function UsagePage() {
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [mpiReport, setMpiReport] = useState<MpiReport | null>(null);
  const [mpiTrends, setMpiTrends] = useState<MpiTrends | null>(null);
  const [mpiComparison, setMpiComparison] = useState<ComparisonData | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Filters
  const [filterModel, setFilterModel] = useState('');
  const [filterTaskType, setFilterTaskType] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const buildMpiUrl = useCallback((extra: Record<string, string> = {}) => {
    const params = new URLSearchParams();
    if (filterModel)    params.set('model', filterModel);
    if (filterTaskType) params.set('task_type', filterTaskType);
    if (filterDateFrom) params.set('date_from', filterDateFrom);
    if (filterDateTo)   params.set('date_to', filterDateTo);
    for (const [k, v] of Object.entries(extra)) params.set(k, v);
    const q = params.toString();
    return `/api/mpi${q ? '?' + q : ''}`;
  }, [filterModel, filterTaskType, filterDateFrom, filterDateTo]);

  const refresh = useCallback(() => {
    fetch('/api/usage').then(r => r.json()).then(setUsageData).catch(() => {});
    fetch(buildMpiUrl()).then(r => r.json()).then(setMpiReport).catch(() => {});
    fetch(buildMpiUrl({ trends: 'true' })).then(r => r.json()).then(setMpiTrends).catch(() => {});
    setMpiComparison(null);
    setLastRefresh(new Date());
  }, [buildMpiUrl]);

  // Initial load + 5-min auto-refresh
  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [refresh]);

  const handleCompare = (a: string, b: string) => {
    fetch(buildMpiUrl({ compare: `${a},${b}` }))
      .then(r => r.json())
      .then(setMpiComparison)
      .catch(() => {});
  };

  const allModels = mpiReport ? Object.keys(mpiReport.model_stats) : [];
  const allTaskTypes = mpiReport ? mpiReport.task_types.map(t => t.type) : [];
  const maxModelCost = usageData
    ? Math.max(...Object.values(usageData.modelCosts), 0.01)
    : 0.01;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Model Usage & Cost Tracker</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            Refreshed {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            onClick={refresh}
            className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-gray-300"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* ── Usage Stats ── */}
      {usageData && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Cost Today" value={`$${usageData.stats.totalCostToday}`} color="text-green-400" />
            <StatCard label="Total Tokens" value={formatNum(usageData.stats.totalTokens)} color="text-cyan-400" />
            <StatCard label="API Calls" value={String(usageData.stats.apiCalls)} color="text-purple-400" />
            <StatCard label="Unique Agents" value={String(usageData.stats.uniqueAgents)} color="text-yellow-400" />
          </div>

          {Object.keys(usageData.modelCosts).length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-bold text-gray-300 mb-3 uppercase tracking-wider">Cost per Model</h2>
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 space-y-3">
                {Object.entries(usageData.modelCosts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([model, cost]) => (
                    <BarRow key={model} label={model} value={cost} max={maxModelCost} />
                  ))}
              </div>
            </div>
          )}

          <h2 className="text-sm font-bold text-gray-300 mb-3 uppercase tracking-wider">Agent Usage</h2>
          <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden mb-10">
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
                {usageData.agentTable.map(row => (
                  <tr key={row.agent} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="p-3 font-mono text-xs text-cyan-400">{row.agent}</td>
                    <td className="p-3 font-mono text-xs text-gray-400">{row.model}</td>
                    <td className="p-3 text-xs text-right">{row.calls}</td>
                    <td className="p-3 text-xs text-right text-gray-400">{formatNum(row.tokensIn)}</td>
                    <td className="p-3 text-xs text-right text-gray-400">{formatNum(row.tokensOut)}</td>
                    <td className="p-3 text-xs text-right text-green-400">${row.cost.toFixed(4)}</td>
                  </tr>
                ))}
                {usageData.agentTable.length === 0 && (
                  <tr><td colSpan={6} className="p-4 text-center text-gray-500">No usage data for today</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── MPI Section ── */}
      <div className="border-t border-gray-800 pt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">MPI — Model Performance Index</h2>
          {mpiReport && (
            <span className="text-xs text-gray-500">
              {mpiReport.total} records · {mpiReport.models} models
            </span>
          )}
        </div>

        {/* Filters */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Filters</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Model</label>
              <select
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-gray-300 focus:outline-none"
                value={filterModel}
                onChange={e => setFilterModel(e.target.value)}
              >
                <option value="">All models</option>
                {allModels.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Task Type</label>
              <select
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-gray-300 focus:outline-none"
                value={filterTaskType}
                onChange={e => setFilterTaskType(e.target.value)}
              >
                <option value="">All types</option>
                {allTaskTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Date From</label>
              <input
                type="date"
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-gray-300 focus:outline-none"
                value={filterDateFrom}
                onChange={e => setFilterDateFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Date To</label>
              <input
                type="date"
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-gray-300 focus:outline-none"
                value={filterDateTo}
                onChange={e => setFilterDateTo(e.target.value)}
              />
            </div>
          </div>
          <button
            onClick={refresh}
            className="mt-3 px-4 py-1.5 text-xs bg-cyan-800 hover:bg-cyan-700 rounded text-white"
          >
            Apply Filters
          </button>
        </div>

        {/* Performance Rankings */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mb-6">
          <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4">Performance Rankings</h3>
          {mpiReport ? <PerformanceRankings stats={mpiReport.model_stats} /> : <p className="text-gray-500 text-sm">Loading…</p>}
        </div>

        {/* Cost Efficiency */}
        {mpiReport && Object.keys(mpiReport.model_stats).length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mb-6">
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4">Cost Efficiency (Tasks / $)</h3>
            <div className="space-y-3">
              {(() => {
                const maxEff = Math.max(...Object.values(mpiReport.model_stats).map(s => s.cost_efficiency), 1);
                return Object.entries(mpiReport.model_stats)
                  .sort(([, a], [, b]) => b.cost_efficiency - a.cost_efficiency)
                  .map(([model, s]) => (
                    <BarRow key={model} label={model} value={s.cost_efficiency} max={maxEff} color="bg-green-600" />
                  ));
              })()}
            </div>
          </div>
        )}

        {/* Confidence Distribution */}
        {mpiReport && Object.keys(mpiReport.model_stats).length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mb-6">
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4">Avg Confidence Score by Model</h3>
            <div className="space-y-3">
              {Object.entries(mpiReport.model_stats)
                .sort(([, a], [, b]) => b.avg_confidence - a.avg_confidence)
                .map(([model, s]) => (
                  <BarRow key={model} label={model} value={s.avg_confidence} max={100} color="bg-purple-600" />
                ))}
            </div>
          </div>
        )}

        {/* FVP Trend */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mb-6">
          <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4">FVP Pass Rate Trend (by day)</h3>
          {mpiTrends ? <FvpTrend trends={mpiTrends} /> : <p className="text-gray-500 text-sm">Loading…</p>}
        </div>

        {/* Task Type Distribution */}
        {mpiReport && mpiReport.task_types.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mb-6">
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4">Task Type Distribution</h3>
            <div className="space-y-3">
              {(() => {
                const maxCount = Math.max(...mpiReport.task_types.map(t => t.count), 1);
                return mpiReport.task_types.map(t => (
                  <div key={t.type} className="flex items-center gap-3">
                    <span className="w-36 text-xs font-mono text-gray-400 truncate">{t.type}</span>
                    <div className="flex-1 bg-gray-800 rounded-full h-4 overflow-hidden">
                      <div className="h-full bg-yellow-600 rounded-full" style={{ width: `${(t.count / maxCount) * 100}%` }} />
                    </div>
                    <span className="text-xs font-mono text-gray-300 w-8 text-right">{t.count}</span>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {/* Model Comparison Widget */}
        {allModels.length >= 2 && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mb-6">
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4">Model Comparison</h3>
            <ComparisonWidget models={allModels} onCompare={handleCompare} data={mpiComparison} />
          </div>
        )}

        {/* No MPI Data State */}
        {mpiReport && mpiReport.total === 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-500 text-sm">No MPI data yet. Data appears here as agents complete tasks and log outcomes.</p>
          </div>
        )}
      </div>
    </div>
  );
}
