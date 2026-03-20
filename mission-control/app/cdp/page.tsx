/**
 * CDP Board Session Dashboard — ONXZA Mission Control
 * Shows all Collaborative Definition Protocol sessions and their state.
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 * Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
 */
'use client';

import { useEffect, useState } from 'react';

interface CdpSession {
  id: string;
  project_slug: string;
  company: string;
  vision_type: string;
  state: string;
  created_at: string;
  avg_confidence: number;
  questions: string[];
  answers: Record<string, string>;
  vision_md_path: string | null;
  board_roles: string[];
  vision_input: string;
  approved_at: string | null;
}

interface CdpData {
  sessions: CdpSession[];
  summary: { total: number; approved: number; in_review: number; awaiting_answers: number; draft: number };
}

const STATE_STYLES: Record<string, { badge: string; icon: string }> = {
  'DRAFT':             { badge: 'bg-gray-800 text-gray-400 border-gray-700', icon: '📝' },
  'CDP-REVIEW':        { badge: 'bg-blue-900/40 text-blue-300 border-blue-800', icon: '🔍' },
  'AWAITING-ANSWERS':  { badge: 'bg-yellow-900/40 text-yellow-300 border-yellow-800', icon: '⏳' },
  'APPROVED':          { badge: 'bg-green-900/40 text-green-300 border-green-800', icon: '✅' },
  'SUPERSEDED':        { badge: 'bg-gray-800 text-gray-500 border-gray-700', icon: '📦' },
};

function StateBadge({ state }: { state: string }) {
  const style = STATE_STYLES[state] || STATE_STYLES['DRAFT'];
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${style.badge}`}>
      {style.icon} {state}
    </span>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 70 ? 'bg-green-500' : value >= 40 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs text-gray-500">{value}/100</span>
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

export default function CdpPage() {
  const [data, setData] = useState<CdpData | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    fetch('/api/cdp')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="text-gray-500 text-sm font-mono p-8">Loading CDP sessions...</div>;
  if (!data) return <div className="text-red-400 p-8">Failed to load CDP data.</div>;

  const selectedSession = data.sessions.find(s => s.id === selected);
  const awaitingAction = data.sessions.filter(s => s.state === 'CDP-REVIEW' || s.state === 'AWAITING-ANSWERS');

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">🤝 CDP Sessions</h1>
        <span className="text-xs text-gray-600 font-mono">Collaborative Definition Protocol · refresh 30s</span>
      </div>

      {/* Alert for sessions awaiting action */}
      {awaitingAction.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-950 border border-yellow-800 rounded-lg text-yellow-300 text-sm">
          ⏳ {awaitingAction.length} session(s) awaiting action
          {awaitingAction.map(s => (
            <div key={s.id} className="text-xs mt-1 font-mono">→ {s.id} [{s.state}]</div>
          ))}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total', value: data.summary.total, color: 'border-gray-800' },
          { label: '✅ Approved', value: data.summary.approved, color: 'border-green-900/40' },
          { label: '🔍 In Review', value: data.summary.in_review, color: 'border-blue-900/40' },
          { label: '⏳ Awaiting', value: data.summary.awaiting_answers, color: 'border-yellow-900/40' },
          { label: '📝 Draft', value: data.summary.draft, color: 'border-gray-800' },
        ].map(s => (
          <div key={s.label} className={`bg-gray-900 rounded-lg border p-3 ${s.color}`}>
            <div className="text-xl font-bold font-mono">{s.value}</div>
            <div className="text-[11px] text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Session list */}
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Sessions</h2>
          {data.sessions.length === 0 ? (
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 text-center text-gray-600 text-sm">
              No CDP sessions yet.
              <div className="mt-3 font-mono text-xs text-gray-700">
                onxza vision intake &quot;Your vision...&quot;
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {data.sessions.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelected(selected === s.id ? null : s.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selected === s.id ? 'bg-cyan-950 border-cyan-700' : 'bg-gray-900 border-gray-800 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <StateBadge state={s.state} />
                    <span className="text-xs text-gray-500">{timeAgo(s.created_at)}</span>
                  </div>
                  <div className="text-sm text-white font-medium mb-1">
                    {s.project_slug.replace(/-/g, ' ')}
                  </div>
                  <div className="flex gap-3 text-[11px] text-gray-500">
                    <span>[{s.company}]</span>
                    <span>{s.questions.length}/5 questions</span>
                    <span className="ml-auto font-mono text-[10px] text-gray-700">{s.id.slice(0, 24)}</span>
                  </div>
                  <div className="mt-2">
                    <ConfidenceBar value={s.avg_confidence} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Session detail */}
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            {selectedSession ? `Detail — ${selectedSession.project_slug}` : 'Select a session'}
          </h2>

          {!selectedSession ? (
            <div className="space-y-4">
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
                <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">CLI Reference</h3>
                <pre className="text-xs text-gray-500 font-mono whitespace-pre-wrap leading-5">{`# Start a new CDP session
onxza vision intake "I want to build..." \\
  --company DTP --type business

# Process Aaron's answers
onxza vision answer \\
  --session CDP-YYYYMMDD-HHMMSS-XXXXXX \\
  --go      # or --answers my-answers.json

# Approve manually
onxza vision approve-session <session-id>

# List all sessions
onxza vision sessions

# Session state flow:
# DRAFT → CDP-REVIEW → AWAITING-ANSWERS → APPROVED`}</pre>
              </div>
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 text-xs text-gray-500">
                <div className="font-semibold text-gray-400 mb-2">CDP-001 Protocol</div>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Aaron gives raw vision input</li>
                  <li>Board analyzes independently (Round 1)</li>
                  <li>Questions synthesized — max 5 (Round 3)</li>
                  <li>Aaron answers</li>
                  <li>Refined vision.md generated</li>
                  <li>Status → APPROVED — IMMUTABLE</li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Meta */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-900 rounded border border-gray-800 p-3">
                  <div className="text-xs text-gray-500">State</div>
                  <div className="mt-1"><StateBadge state={selectedSession.state} /></div>
                </div>
                <div className="bg-gray-900 rounded border border-gray-800 p-3">
                  <div className="text-xs text-gray-500">Confidence</div>
                  <div className="mt-1"><ConfidenceBar value={selectedSession.avg_confidence} /></div>
                </div>
              </div>

              {/* Vision input */}
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-3">
                <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Aaron&apos;s Input</h3>
                <div className="text-xs text-gray-300 leading-relaxed italic">
                  &ldquo;{selectedSession.vision_input.slice(0, 300)}{selectedSession.vision_input.length > 300 ? '…' : ''}&rdquo;
                </div>
              </div>

              {/* Questions */}
              {selectedSession.questions.length > 0 && (
                <div className="bg-gray-900 rounded-lg border border-gray-800 p-3">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">
                    Questions ({selectedSession.questions.length}/5 max)
                  </h3>
                  {selectedSession.questions.map((q, i) => (
                    <div key={i} className="mb-3">
                      <div className="text-xs text-cyan-400 mb-0.5">Q{i + 1}</div>
                      <div className="text-xs text-gray-300">{q}</div>
                      {selectedSession.answers?.[String(i + 1)] && (
                        <div className="text-xs text-green-400 mt-1 pl-2 border-l border-green-800">
                          A: {selectedSession.answers[String(i + 1)]}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Board */}
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-3">
                <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Board</h3>
                <div className="flex flex-wrap gap-1">
                  {selectedSession.board_roles.map(r => (
                    <span key={r} className="text-[10px] px-1.5 py-0.5 bg-gray-800 text-gray-400 rounded border border-gray-700 font-mono">
                      {r}
                    </span>
                  ))}
                </div>
              </div>

              {/* Vision md + actions */}
              {selectedSession.vision_md_path && (
                <div className="bg-gray-900 rounded-lg border border-green-900/40 p-3">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase mb-1">Vision Document</h3>
                  <div className="text-xs font-mono text-green-400">{selectedSession.vision_md_path}</div>
                </div>
              )}

              {(selectedSession.state === 'CDP-REVIEW' || selectedSession.state === 'AWAITING-ANSWERS') && (
                <div className="bg-gray-900 rounded-lg border border-yellow-900/40 p-3">
                  <h3 className="text-xs font-semibold text-yellow-400 mb-2">⚡ Action Required</h3>
                  <pre className="text-xs text-gray-500 font-mono">{`onxza vision answer \\
  --session ${selectedSession.id} \\
  --go`}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
