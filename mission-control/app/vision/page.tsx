/**
 * Vision Lock Dashboard — ONXZA Mission Control
 * Shows lock status of all vision.md files, checkpoint hash verification,
 * and pending vision_update_request tickets.
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 * Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
 */
'use client';

import { useEffect, useState } from 'react';

interface VisionFile {
  path: string;
  status: string;
  immutable: boolean;
  in_review: boolean;
  hash: string;
  checksum_match: boolean | null;
}

interface UpdateRequest {
  ticket_id: string;
  vision_file: string;
  agent: string;
  created_at: string;
}

interface VisionLockData {
  vision_files: VisionFile[];
  total: number;
  immutable_count: number;
  violation_count: number;
  checkpoint: string | null;
  pending_update_requests: UpdateRequest[];
  generated_at: string;
}

function StatusBadge({ file }: { file: VisionFile }) {
  if (file.checksum_match === false && file.immutable) {
    return <span className="px-2 py-0.5 rounded text-[11px] bg-red-900 text-red-300 border border-red-700 font-bold">⚠ TAMPERED</span>;
  }
  if (file.immutable) {
    return <span className="px-2 py-0.5 rounded text-[11px] bg-green-900 text-green-300 border border-green-700">🔒 IMMUTABLE</span>;
  }
  if (file.in_review) {
    return <span className="px-2 py-0.5 rounded text-[11px] bg-yellow-900 text-yellow-300 border border-yellow-700">📋 CDP-REVIEW</span>;
  }
  return <span className="px-2 py-0.5 rounded text-[11px] bg-gray-800 text-gray-400 border border-gray-700">{file.status.slice(0, 20)}</span>;
}

function timeAgo(isoStr: string): string {
  if (!isoStr) return '';
  const diff = Date.now() - new Date(isoStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function VisionPage() {
  const [data, setData] = useState<VisionLockData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    fetch('/api/vision-lock')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="text-gray-500 text-sm font-mono p-8">Loading Vision Lock status...</div>;
  }

  if (!data) {
    return <div className="text-red-400 text-sm p-8">Failed to load Vision Lock data.</div>;
  }

  const violations = data.vision_files.filter(f => f.checksum_match === false && f.immutable);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">🔒 Vision Lock</h1>
        <span className="text-xs text-gray-600 font-mono">refresh 30s</span>
      </div>

      {/* Alert banner for violations */}
      {violations.length > 0 && (
        <div className="mb-6 p-4 bg-red-950 border border-red-700 rounded-lg">
          <div className="text-red-300 font-bold text-sm mb-1">
            ⚠ VISION LOCK VIOLATION — {violations.length} immutable vision file(s) modified
          </div>
          {violations.map(f => (
            <div key={f.path} className="text-red-400 text-xs font-mono mt-1">→ {f.path}</div>
          ))}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
          <div className="text-2xl font-bold font-mono">{data.total}</div>
          <div className="text-xs text-gray-500 mt-1">Total Vision Files</div>
        </div>
        <div className="bg-gray-900 rounded-lg border border-green-900/40 p-4">
          <div className="text-2xl font-bold font-mono text-green-400">{data.immutable_count}</div>
          <div className="text-xs text-gray-500 mt-1">🔒 Immutable</div>
        </div>
        <div className={`bg-gray-900 rounded-lg border p-4 ${data.violation_count > 0 ? 'border-red-700' : 'border-gray-800'}`}>
          <div className={`text-2xl font-bold font-mono ${data.violation_count > 0 ? 'text-red-400' : 'text-gray-400'}`}>
            {data.violation_count}
          </div>
          <div className="text-xs text-gray-500 mt-1">Violations</div>
        </div>
        <div className={`bg-gray-900 rounded-lg border p-4 ${data.pending_update_requests.length > 0 ? 'border-yellow-800' : 'border-gray-800'}`}>
          <div className="text-2xl font-bold font-mono text-yellow-400">{data.pending_update_requests.length}</div>
          <div className="text-xs text-gray-500 mt-1">Pending Update Requests</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vision file table */}
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Vision Documents
            {data.checkpoint && (
              <span className="ml-2 text-gray-600 normal-case font-normal">
                vs checkpoint: <span className="font-mono text-xs">{data.checkpoint.slice(0, 20)}…</span>
              </span>
            )}
          </h2>
          <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-3 py-2 text-gray-500 font-normal">File</th>
                  <th className="text-left px-3 py-2 text-gray-500 font-normal">Status</th>
                  <th className="text-center px-3 py-2 text-gray-500 font-normal">Hash</th>
                </tr>
              </thead>
              <tbody>
                {data.vision_files.map(f => (
                  <tr
                    key={f.path}
                    className={`border-b border-gray-800/50 hover:bg-gray-800/20 ${
                      f.checksum_match === false && f.immutable ? 'bg-red-950/20' : ''
                    }`}
                  >
                    <td className="px-3 py-2 font-mono text-gray-300 truncate max-w-[180px]" title={f.path}>
                      {f.path.split('/').slice(-2).join('/')}
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge file={f} />
                    </td>
                    <td className="px-3 py-2 text-center">
                      {f.checksum_match === true && <span className="text-green-500">✓</span>}
                      {f.checksum_match === false && <span className="text-red-500 font-bold">✗</span>}
                      {f.checksum_match === null && <span className="text-gray-600 text-[10px]">–</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column: pending requests + commands */}
        <div className="space-y-4">
          {/* Pending update requests */}
          <div>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Pending Update Requests
            </h2>
            {data.pending_update_requests.length === 0 ? (
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 text-sm text-gray-600">
                No pending vision update requests ✓
              </div>
            ) : (
              <div className="space-y-2">
                {data.pending_update_requests.map(r => (
                  <div key={r.ticket_id} className="bg-gray-900 rounded-lg border border-yellow-900/40 p-3">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-mono text-xs text-yellow-400 truncate">{r.ticket_id}</span>
                      <span className="text-xs text-gray-500 shrink-0">{timeAgo(r.created_at)}</span>
                    </div>
                    <div className="text-xs text-gray-400 font-mono">{r.vision_file}</div>
                    <div className="text-xs text-gray-500 mt-1">Agent: {r.agent || '—'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CLI quick reference */}
          <div>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              CLI Commands
            </h2>
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-3">
              <pre className="text-xs text-gray-500 font-mono whitespace-pre-wrap leading-5">{`# Check lock status
onxza vision status

# Verify vs checkpoint
onxza vision verify

# Check a specific file
onxza vision check projects/<slug>/vision.md

# Request a vision change
onxza vision create-update-request \\
  --vision projects/<slug>/vision.md \\
  --agent <agent-id>

# Scaffold CDP board session
onxza vision review <project-slug>`}</pre>
            </div>
          </div>

          {/* Protocol reminder */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-3 text-xs text-gray-500">
            <div className="font-semibold text-gray-400 mb-2">Vision Update Protocol (DOC-007)</div>
            <ol className="list-decimal list-inside space-y-1">
              <li>Any agent creates a <span className="font-mono text-yellow-400">vision_update_request</span> ticket</li>
              <li>Ticket routes to Marcus</li>
              <li>Marcus reviews against DOC-007</li>
              <li>Marcus surfaces to Aaron (1 sentence what, 1 sentence why)</li>
              <li>Aaron decides — <span className="text-cyan-400">only Aaron can approve</span></li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
