/**
 * Master Dashboard — ONXZA Mission Control
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */
import { OPENCLAW_HOME, WORKSPACE_PATH, readJsonlFile, listFiles, listDirs, readFileContent, getFileMtime } from '@/lib/fs-utils';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';

function getAgentStates() {
  const agents: { id: string; state: string; lastActive: Date | null }[] = [];
  try {
    const entries = fs.readdirSync(OPENCLAW_HOME).filter((d) => d.startsWith('workspace-'));
    for (const dir of entries) {
      const agentId = dir.replace('workspace-', '');
      const memPath = path.join(OPENCLAW_HOME, dir, 'MEMORY.md');
      const content = readFileContent(memPath);
      const mtime = getFileMtime(memPath);
      let state = 'NEVER RUN';
      if (content) {
        state = 'IDLE';
        const hoursAgo = mtime ? (Date.now() - mtime.getTime()) / (1000 * 60 * 60) : null;
        if (hoursAgo !== null && hoursAgo < 1) state = 'ACTIVE';
      }
      agents.push({ id: agentId, state, lastActive: mtime });
    }
  } catch { /* ignore */ }
  return agents;
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-400 mt-1">{label}</div>
    </div>
  );
}

function StateBadge({ state }: { state: string }) {
  const colors: Record<string, string> = {
    ACTIVE: 'bg-green-900 text-green-300',
    IDLE: 'bg-yellow-900 text-yellow-300',
    'NEVER RUN': 'bg-gray-800 text-gray-400',
  };
  return (
    <span className={`px-2 py-0.5 text-[10px] font-mono rounded ${colors[state] || colors['NEVER RUN']}`}>
      {state}
    </span>
  );
}

export default function MasterDashboard() {
  const agents = getAgentStates();
  const agentDirs = listDirs(path.join(OPENCLAW_HOME, 'agents'));
  const openTickets = listFiles(path.join(WORKSPACE_PATH, 'tickets', 'open'), '.md');
  const closedTickets = listFiles(path.join(WORKSPACE_PATH, 'tickets', 'closed'), '.md');
  const dispatchLog = readJsonlFile(path.join(WORKSPACE_PATH, 'logs', 'dispatch-log.jsonl'));

  const today = new Date().toISOString().slice(0, 10);
  const dispatchesToday = dispatchLog.filter((d) => String(d.timestamp || '').startsWith(today));
  const activeNow = agents.filter((a) => a.state === 'ACTIVE').length;
  const lastDispatches = dispatchLog.slice(-5).reverse();

  const sortedAgents = agents.sort((a, b) => {
    const order: Record<string, number> = { ACTIVE: 0, IDLE: 1, 'NEVER RUN': 2 };
    return (order[a.state] ?? 2) - (order[b.state] ?? 2);
  });

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Master Dashboard</h1>

      {/* Stat Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <StatCard label="Total Agents" value={agentDirs.length} color="text-cyan-400" />
        <StatCard label="Active Now" value={activeNow} color="text-green-400" />
        <StatCard label="Open Tickets" value={openTickets.length} color="text-yellow-400" />
        <StatCard label="Closed Tickets" value={closedTickets.length} color="text-blue-400" />
        <StatCard label="Dispatches Today" value={dispatchesToday.length} color="text-purple-400" />
      </div>

      {/* Agent Grid */}
      <h2 className="text-sm font-bold text-gray-300 mb-3 uppercase tracking-wider">Agent Status</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
        {sortedAgents.map((agent) => (
          <div key={agent.id} className="p-3 bg-gray-900 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors">
            <div className="font-mono text-xs text-white truncate mb-1">{agent.id}</div>
            <StateBadge state={agent.state} />
            <div className="text-[10px] text-gray-500 mt-2">
              {agent.lastActive
                ? new Date(agent.lastActive).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                : 'Never'}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Dispatches */}
      <h2 className="text-sm font-bold text-gray-300 mb-3 uppercase tracking-wider">Recent Dispatches</h2>
      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-xs">
              <th className="text-left p-3">Timestamp</th>
              <th className="text-left p-3">Agent</th>
              <th className="text-left p-3">Ticket</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Summary</th>
            </tr>
          </thead>
          <tbody>
            {lastDispatches.map((d, i) => (
              <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="p-3 font-mono text-xs text-gray-400">{String(d.timestamp || '').slice(11, 19)}</td>
                <td className="p-3 font-mono text-xs">{String(d.assigned_to || '')}</td>
                <td className="p-3 font-mono text-xs text-cyan-400">{String(d.ticket_id || '')}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 text-[10px] rounded ${
                    d.status === 'ok' || d.status === 'dispatched' ? 'bg-green-900/50 text-green-300' :
                    d.status === 'error' ? 'bg-red-900/50 text-red-300' :
                    'bg-yellow-900/50 text-yellow-300'
                  }`}>
                    {String(d.status || '')}
                  </span>
                </td>
                <td className="p-3 text-xs text-gray-300 truncate max-w-xs">{String(d.summary || '')}</td>
              </tr>
            ))}
            {lastDispatches.length === 0 && (
              <tr><td colSpan={5} className="p-4 text-center text-gray-500 text-sm">No dispatches yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
