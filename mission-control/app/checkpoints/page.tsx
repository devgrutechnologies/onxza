/**
 * Checkpoint Viewer — ONXZA Mission Control
 * Lists all safety checkpoints with vision hash status and agent counts.
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 * Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
 */
'use client';

import { useEffect, useState } from 'react';

interface CheckpointSummary {
  checkpoint_id: string;
  timestamp: string;
  event: string;
  agent_count: number;
  vision_files: number;
  files_modified: number;
  has_vision_hashes: boolean;
}

interface CheckpointDetail {
  checkpoint_id: string;
  timestamp: string;
  event: string;
  agent_count: number;
  vision_files: number;
  files_modified: number;
  has_vision_hashes: boolean;
  vision_hashes: Record<string, string>;
  agents: string[];
  manifest: Record<string, unknown>;
}

function timeAgo(ts: string): string {
  if (!ts) return 'unknown';
  const then = new Date(ts).getTime();
  const now = Date.now();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return `${Math.floor(diffH / 24)}d ago`;
}

export default function CheckpointsPage() {
  const [checkpoints, setCheckpoints] = useState<CheckpointSummary[]>([]);
  const [selected, setSelected] = useState<CheckpointDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchCheckpoints = () => {
    fetch('/api/checkpoints')
      .then((r) => r.json())
      .then((d) => {
        setCheckpoints(d.checkpoints || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchCheckpoints();
    const interval = setInterval(fetchCheckpoints, 30000);
    return () => clearInterval(interval);
  }, []);

  const selectCheckpoint = (id: string) => {
    if (selected?.checkpoint_id === id) {
      setSelected(null);
      return;
    }
    setDetailLoading(true);
    fetch(`/api/checkpoints?id=${encodeURIComponent(id)}`)
      .then((r) => r.json())
      .then((d) => {
        setSelected(d);
        setDetailLoading(false);
      })
      .catch(() => setDetailLoading(false));
  };

  if (loading) {
    return (
      <div className="text-gray-500 text-sm font-mono p-8">Loading checkpoints...</div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">🛡️ Checkpoint System</h1>
        <span className="text-xs text-gray-600 font-mono">{checkpoints.length} checkpoints · refresh 30s</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Checkpoint list */}
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">All Checkpoints</h2>
          <div className="space-y-2">
            {checkpoints.length === 0 && (
              <div className="text-gray-600 text-sm p-4 bg-gray-900 rounded border border-gray-800">
                No checkpoints found.
              </div>
            )}
            {checkpoints.map((cp) => (
              <button
                key={cp.checkpoint_id}
                onClick={() => selectCheckpoint(cp.checkpoint_id)}
                className={`w-full text-left p-3 rounded border transition-colors ${
                  selected?.checkpoint_id === cp.checkpoint_id
                    ? 'bg-cyan-950 border-cyan-700'
                    : 'bg-gray-900 border-gray-800 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-mono text-xs text-cyan-400 truncate">{cp.checkpoint_id}</span>
                  <span className="text-xs text-gray-500 shrink-0">{timeAgo(cp.timestamp)}</span>
                </div>
                <div className="text-sm text-white mb-2 truncate">{cp.event.replace(/-/g, ' ')}</div>
                <div className="flex gap-3 text-[11px] text-gray-500">
                  <span>👥 {cp.agent_count} agents</span>
                  <span>📄 {cp.vision_files} vision files</span>
                  {cp.has_vision_hashes
                    ? <span className="text-green-500">✓ hashes</span>
                    : <span className="text-gray-600">no hashes (legacy)</span>
                  }
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Checkpoint detail */}
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            {selected ? `Detail — ${selected.checkpoint_id}` : 'Select a checkpoint'}
          </h2>

          {detailLoading && (
            <div className="text-gray-500 text-sm font-mono p-4 bg-gray-900 rounded border border-gray-800">
              Loading...
            </div>
          )}

          {!detailLoading && !selected && (
            <div className="text-gray-600 text-sm p-4 bg-gray-900 rounded border border-gray-800">
              Click a checkpoint on the left to see details.
            </div>
          )}

          {!detailLoading && selected && (
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Agents', value: selected.agent_count },
                  { label: 'Vision Files', value: selected.vision_files },
                  { label: 'Files Modified', value: selected.files_modified },
                  { label: 'Timestamp', value: selected.timestamp.slice(0, 16).replace('T', ' ') || '—' },
                ].map((s) => (
                  <div key={s.label} className="bg-gray-900 rounded border border-gray-800 p-3">
                    <div className="text-lg font-bold font-mono">{s.value}</div>
                    <div className="text-xs text-gray-500">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Vision Hashes */}
              {Object.keys(selected.vision_hashes).length > 0 && (
                <div className="bg-gray-900 rounded border border-gray-800 p-3">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Vision Hashes</h3>
                  <div className="space-y-1">
                    {Object.entries(selected.vision_hashes).map(([path, hash]) => (
                      <div key={path} className="flex items-center gap-2 text-xs font-mono">
                        <span className="text-green-500">✓</span>
                        <span className="text-gray-300 truncate flex-1">{path}</span>
                        <span className="text-gray-600 shrink-0">{hash.slice(0, 12)}…</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Agents preview */}
              {selected.agents.length > 0 && (
                <div className="bg-gray-900 rounded border border-gray-800 p-3">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">
                    Registered Agents ({selected.agents.length})
                  </h3>
                  <div className="max-h-48 overflow-y-auto space-y-0.5">
                    {selected.agents.map((a) => (
                      <div key={a} className="text-xs font-mono text-gray-400">{a}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Restore instructions */}
              <div className="bg-gray-900 rounded border border-gray-800 p-3">
                <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Restore</h3>
                <pre className="text-xs text-gray-500 font-mono whitespace-pre-wrap">
{`onxza checkpoint restore ${selected.checkpoint_id}
onxza checkpoint verify  ${selected.checkpoint_id}`}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
