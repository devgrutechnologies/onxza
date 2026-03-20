/**
 * Shared Learnings Browser — ONXZA Mission Control
 * Shows the learning browser + promotion pipeline state.
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 * Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
 */
'use client';

import { useEffect, useState } from 'react';

interface Learning {
  relativePath: string;
  filename: string;
  meta: Record<string, string>;
  preview: string;
}

interface PendingReview {
  ticket_id: string;
  company: string;
  learning_type: string;
  learning_file: string;
  submitted_by: string;
  assigned_to: string;
  created_at: string;
}

interface PromotedEntry {
  path: string;
  filename: string;
  promoted_at: string;
  promoted_from: string;
  promoted_by: string;
  type: string;
  company: string;
}

interface PipelineData {
  total_files: number;
  tier_counts: Record<string, number>;
  type_counts: Record<string, number>;
  pending_review: PendingReview[];
  recently_promoted: PromotedEntry[];
}

type Tab = 'browser' | 'pipeline';

function timeAgo(iso: string): string {
  if (!iso) return '';
  const d = Date.now() - new Date(iso).getTime();
  const m = Math.floor(d / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function LearningsPage() {
  const [learnings, setLearnings] = useState<Learning[]>([]);
  const [tree, setTree] = useState<Record<string, string[]>>({});
  const [pipeline, setPipeline] = useState<PipelineData | null>(null);
  const [selectedDir, setSelectedDir] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<Tab>('browser');

  const fetchAll = () => {
    fetch('/api/learnings')
      .then(r => r.json())
      .then(d => { setLearnings(d.learnings || []); setTree(d.tree || {}); })
      .catch(() => {});

    fetch('/api/learnings/pipeline')
      .then(r => r.json())
      .then(d => setPipeline(d))
      .catch(() => {});
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, []);

  const dirs = Object.keys(tree).sort();
  const filtered = learnings.filter(l => {
    if (selectedDir !== null && !l.relativePath.startsWith(selectedDir === '.' ? '' : selectedDir)) return false;
    if (search) {
      const s = search.toLowerCase();
      return l.filename.toLowerCase().includes(s) || l.preview.toLowerCase().includes(s);
    }
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">📚 Shared Learnings</h1>
        <div className="flex gap-1">
          {(['browser', 'pipeline'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-xs rounded capitalize ${
                tab === t ? 'bg-cyan-900 text-cyan-300' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {t === 'pipeline'
                ? `Promotion Pipeline${pipeline?.pending_review.length ? ` (${pipeline.pending_review.length})` : ''}`
                : 'Browser'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Browser tab ─────────────────────────────────────────────── */}
      {tab === 'browser' && (
        <div className="flex gap-4">
          {/* Tree Sidebar */}
          <div className="w-56 shrink-0 bg-gray-900 rounded-lg border border-gray-800 p-3 max-h-[80vh] overflow-y-auto">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Directories</h3>
            <button
              className={`block w-full text-left text-xs px-2 py-1.5 rounded ${selectedDir === null ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
              onClick={() => setSelectedDir(null)}
            >
              All ({learnings.length})
            </button>
            {dirs.map(dir => (
              <button
                key={dir}
                className={`block w-full text-left text-xs px-2 py-1.5 rounded truncate ${selectedDir === dir ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
                onClick={() => setSelectedDir(dir)}
              >
                {dir === '.' ? 'root' : dir} ({tree[dir].length})
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1">
            <input
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-300 placeholder-gray-600 mb-4"
              placeholder="Search learnings..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <div className="space-y-3">
              {filtered.map(l => (
                <div key={l.relativePath} className="p-4 bg-gray-900 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="font-mono text-xs text-cyan-400">{l.filename}</span>
                    {l.meta?.type && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-gray-800 text-gray-400 rounded">{l.meta.type}</span>
                    )}
                    {l.meta?.status === 'promoted' && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-green-900/40 text-green-400 rounded">↑ promoted</span>
                    )}
                    <span className="text-[10px] text-gray-600">{l.relativePath}</span>
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-3">{l.preview || 'No preview available'}</p>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="text-sm text-gray-500 text-center py-8">No learnings found</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Pipeline tab ─────────────────────────────────────────────── */}
      {tab === 'pipeline' && pipeline && (
        <div className="space-y-6">
          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-3">
              <div className="text-2xl font-bold font-mono">{pipeline.total_files}</div>
              <div className="text-xs text-gray-500">Total Files</div>
            </div>
            {Object.entries(pipeline.tier_counts).map(([tier, count]) => (
              <div key={tier} className="bg-gray-900 rounded-lg border border-gray-800 p-3">
                <div className="text-2xl font-bold font-mono">{count}</div>
                <div className="text-xs text-gray-500">{tier}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Review queue */}
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Pending Review
                {pipeline.pending_review.length > 0 && (
                  <span className="ml-2 bg-yellow-900 text-yellow-300 text-[10px] px-1.5 py-0.5 rounded">
                    {pipeline.pending_review.length}
                  </span>
                )}
              </h2>
              {pipeline.pending_review.length === 0 ? (
                <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 text-sm text-gray-600">
                  No pending approvals ✓
                </div>
              ) : (
                <div className="space-y-2">
                  {pipeline.pending_review.map(r => (
                    <div key={r.ticket_id} className="bg-gray-900 rounded-lg border border-yellow-900/40 p-3">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="font-mono text-xs text-yellow-400 truncate">{r.ticket_id}</span>
                        <span className="text-xs text-gray-500 shrink-0">{timeAgo(r.created_at)}</span>
                      </div>
                      <div className="text-xs text-gray-300 truncate font-mono">{r.learning_file}</div>
                      <div className="flex gap-3 text-[10px] text-gray-500 mt-1">
                        <span>[{r.company}]</span>
                        <span>{r.learning_type}</span>
                        <span>by {r.submitted_by} → {r.assigned_to}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Type breakdown */}
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 mt-6">
                By Type
              </h2>
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-3">
                {Object.entries(pipeline.type_counts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center py-1 border-b border-gray-800/40 last:border-0">
                      <span className="text-xs text-gray-400 font-mono">{type}</span>
                      <span className="text-xs font-bold text-gray-300">{count}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Recently promoted + CLI reference */}
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Recently Promoted
              </h2>
              {pipeline.recently_promoted.length === 0 ? (
                <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 text-sm text-gray-600 mb-4">
                  No promotions yet
                </div>
              ) : (
                <div className="space-y-2 mb-6">
                  {pipeline.recently_promoted.slice(0, 8).map((p, i) => (
                    <div key={i} className="bg-gray-900 rounded border border-green-900/30 p-2">
                      <div className="flex items-center gap-2">
                        <span className="text-green-500 text-xs">↑</span>
                        <span className="text-xs text-gray-300 font-mono truncate flex-1">{p.filename}</span>
                        <span className="text-[10px] text-gray-500 shrink-0">{timeAgo(p.promoted_at)}</span>
                      </div>
                      <div className="text-[10px] text-gray-600 mt-0.5 pl-4">
                        [{p.company}] {p.type} → global · by {p.promoted_by}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                CLI Commands
              </h2>
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-3">
                <pre className="text-xs text-gray-500 font-mono whitespace-pre-wrap leading-5">{`# Scaffold a new learning
onxza learnings new <slug> \\
  --company DTP --type pattern

# Push to company tier
onxza learnings push ./my-learning.md \\
  --company DTP --type pattern --agent <id>

# Review queue
onxza learnings review
onxza learnings review --company WDC

# Promote to global
onxza learnings promote \\
  shared-learnings/DTP/patterns/<file>.md \\
  --to global --agent <pm-id>

# List all
onxza learnings list --tier global`}</pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
