/**
 * Agent Lifecycle Dashboard — ONXZA Mission Control
 * Training status, retirement tracking, conversion pipeline.
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 * Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
 */
'use client';

import { useEffect, useState } from 'react';

interface TrainingEntry {
  agent_id: string;
  status: 'NEVER_RUN' | 'IN_TRAINING' | 'GRADUATED';
  sessions: number;
  reviews: number;
  reviews_remaining: number;
  avg_score: number | null;
  last_score: number | null;
}

interface RetiredAgent {
  agent_id: string;
  workspace: string;
  retired_at: string;
  checkpoint: string;
}

interface LifecycleData {
  training: TrainingEntry[];
  summary: { total: number; graduated: number; in_training: number; never_run: number };
  retired_agents: RetiredAgent[];
  notifications: { subject: string; created_at: string }[];
}

type Tab = 'training' | 'retired' | 'commands';
type TrainingFilter = 'all' | 'IN_TRAINING' | 'NEVER_RUN' | 'GRADUATED';

const STATUS_STYLES: Record<string, string> = {
  GRADUATED:   'text-green-400',
  IN_TRAINING: 'text-yellow-400',
  NEVER_RUN:   'text-gray-500',
};

const STATUS_ICONS: Record<string, string> = {
  GRADUATED:   '🟢',
  IN_TRAINING: '🟡',
  NEVER_RUN:   '⬜',
};

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full ${pct >= 100 ? 'bg-green-500' : pct > 0 ? 'bg-yellow-500' : 'bg-gray-700'}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function timeAgo(iso: string): string {
  if (!iso) return '';
  const d = Date.now() - new Date(iso).getTime();
  const m = Math.floor(d / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function LifecyclePage() {
  const [data, setData] = useState<LifecycleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('training');
  const [filter, setFilter] = useState<TrainingFilter>('all');
  const [search, setSearch] = useState('');

  const fetchData = () => {
    fetch('/api/lifecycle')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="text-gray-500 text-sm font-mono p-8">Loading lifecycle data...</div>;
  if (!data) return <div className="text-red-400 text-sm p-8">Failed to load lifecycle data.</div>;

  const filteredTraining = data.training.filter(t => {
    if (filter !== 'all' && t.status !== filter) return false;
    if (search && !t.agent_id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">🔄 Agent Lifecycle</h1>
        <span className="text-xs text-gray-600 font-mono">refresh 30s</span>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Agents',  value: data.summary.total,      color: 'border-gray-800' },
          { label: '🟢 Graduated',  value: data.summary.graduated,  color: 'border-green-900/40' },
          { label: '🟡 In Training',value: data.summary.in_training, color: 'border-yellow-900/40' },
          { label: '⬜ Never Run',  value: data.summary.never_run,   color: 'border-gray-800' },
        ].map(s => (
          <div key={s.label} className={`bg-gray-900 rounded-lg border p-4 ${s.color}`}>
            <div className="text-2xl font-bold font-mono">{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Notifications */}
      {data.notifications.length > 0 && (
        <div className="mb-6 p-3 bg-gray-900 border border-yellow-900/40 rounded-lg">
          <div className="text-xs font-semibold text-gray-400 mb-2">⚡ Recent Lifecycle Notifications</div>
          {data.notifications.map((n, i) => (
            <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-gray-800/40 last:border-0">
              <span className="text-yellow-300">{n.subject}</span>
              <span className="text-gray-600">{timeAgo(n.created_at)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        {(['training', 'retired', 'commands'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-xs rounded capitalize ${
              tab === t ? 'bg-cyan-900 text-cyan-300' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {t === 'retired' ? `Retired (${data.retired_agents.length})` : t === 'training' ? 'Training Status' : 'CLI Commands'}
          </button>
        ))}
      </div>

      {/* Training Status Tab */}
      {tab === 'training' && (
        <div>
          <div className="flex gap-3 mb-4 flex-wrap">
            {(['all', 'IN_TRAINING', 'NEVER_RUN', 'GRADUATED'] as (TrainingFilter)[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-xs rounded ${
                  filter === f ? 'bg-gray-700 text-white' : 'bg-gray-900 text-gray-500 hover:text-white border border-gray-800'
                }`}
              >
                {STATUS_ICONS[f] || '•'} {f === 'all' ? 'All' : f.replace('_', ' ')}
              </button>
            ))}
            <input
              className="flex-1 min-w-0 max-w-xs bg-gray-900 border border-gray-700 rounded px-3 py-1 text-xs text-gray-300 placeholder-gray-600"
              placeholder="Search agent..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-3 py-2 text-gray-500 font-normal">Agent</th>
                  <th className="text-left px-3 py-2 text-gray-500 font-normal">Status</th>
                  <th className="text-center px-3 py-2 text-gray-500 font-normal">Sessions</th>
                  <th className="text-center px-3 py-2 text-gray-500 font-normal">Reviews</th>
                  <th className="text-left px-3 py-2 text-gray-500 font-normal">Progress</th>
                  <th className="text-center px-3 py-2 text-gray-500 font-normal">Avg Score</th>
                </tr>
              </thead>
              <tbody>
                {filteredTraining.map(t => (
                  <tr key={t.agent_id} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                    <td className="px-3 py-2 font-mono text-gray-300">{t.agent_id}</td>
                    <td className={`px-3 py-2 font-mono ${STATUS_STYLES[t.status]}`}>
                      {STATUS_ICONS[t.status]} {t.status.replace('_', ' ')}
                    </td>
                    <td className="px-3 py-2 text-center text-gray-400">{t.sessions}</td>
                    <td className="px-3 py-2 text-center text-gray-400">{t.reviews}/10</td>
                    <td className="px-3 py-2">
                      <ProgressBar value={t.reviews} max={10} />
                    </td>
                    <td className="px-3 py-2 text-center">
                      {t.avg_score != null
                        ? <span className={t.avg_score >= 7 ? 'text-green-400' : t.avg_score >= 5 ? 'text-yellow-400' : 'text-red-400'}>{t.avg_score}</span>
                        : <span className="text-gray-700">—</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredTraining.length === 0 && (
              <div className="text-center text-gray-600 text-sm py-8">No agents match the current filter.</div>
            )}
          </div>
        </div>
      )}

      {/* Retired Agents Tab */}
      {tab === 'retired' && (
        <div>
          {data.retired_agents.length === 0 ? (
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 text-center text-gray-600 text-sm">
              No retired agents
            </div>
          ) : (
            <div className="space-y-3">
              {data.retired_agents.map(r => (
                <div key={r.agent_id} className="bg-gray-900 rounded-lg border border-gray-800 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-mono text-sm text-gray-300">🪦 {r.agent_id}</span>
                    <span className="text-xs text-gray-500">{timeAgo(r.retired_at)}</span>
                  </div>
                  <div className="text-xs text-gray-500 space-y-0.5">
                    <div>Checkpoint: <span className="font-mono text-gray-400">{r.checkpoint}</span></div>
                    <div>Workspace: <span className="font-mono text-gray-600 text-[10px]">{r.workspace}</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CLI Commands Tab */}
      {tab === 'commands' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Retirement</h3>
            <pre className="text-xs text-gray-500 font-mono whitespace-pre-wrap leading-5">{`# Pre-retirement checklist (dry-run)
onxza agent checklist <agent-id>

# Retire an agent
onxza agent retire <agent-id>

# Override blockers (not recommended mid-task)
onxza agent retire <agent-id> --force

Pipeline:
  1. Pre-flight checklist
  2. Checkpoint snapshot
  3. Archive learnings → shared-learnings/[co]/patterns/archived/
  4. Write RETIRED.md to workspace
  5. Remove from openclaw.json
  6. Audit trail + notify Aaron

Workspace is PRESERVED (not deleted).`}</pre>
          </div>

          <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Conversion</h3>
            <pre className="text-xs text-gray-500 font-mono whitespace-pre-wrap leading-5">{`# Convert temporary → persistent daemon
onxza agent convert <agent-id> --to persistent

# Then scaffold missing workspace files if needed
onxza agent create <Company_Dept_Role>

Pipeline:
  1. Checkpoint snapshot
  2. Check 6-file workspace
  3. Update IDENTITY.md persistence class
  4. Re-register in openclaw.json
  5. Audit trail + notify Aaron`}</pre>
          </div>

          <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Training Status</h3>
            <pre className="text-xs text-gray-500 font-mono whitespace-pre-wrap leading-5">{`# All agents
onxza agent training

# Specific agent
onxza agent training wdc-coo

# JSON output
onxza --json agent training wdc-coo

Statuses:
  NEVER_RUN    — 0 sessions
  IN_TRAINING  — < 10 QC reviews completed
  GRADUATED    — 10+ reviews completed`}</pre>
          </div>

          <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Architecture Reference</h3>
            <div className="text-xs text-gray-500 space-y-1">
              <div><span className="text-gray-400">§7.4</span> Persistence Classification</div>
              <div><span className="text-gray-400">§7.5</span> Agent Lifecycle Phases</div>
              <div><span className="text-gray-400">§7.4</span> Conversion Rule</div>
              <div className="pt-2 text-gray-600">
                Every agent starts in training mode for their first 10 tasks.
                Quality reviews tracked in autonomy-scores.jsonl.
                Graduating an agent means 10+ QC reviews completed.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
