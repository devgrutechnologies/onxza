/**
 * Agent Status Board — ONXZA Mission Control
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */
'use client';

import { useEffect, useState } from 'react';

interface Agent {
  id: string;
  company: string;
  state: string;
  task: string;
  model: string;
  lastActive: string | null;
  avgAutonomyScore: string | null;
  sessionCount: number;
  memoryPreview: string;
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

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/agents')
      .then((r) => r.json())
      .then((d) => setAgents(d.agents || []))
      .catch(() => {});
    const interval = setInterval(() => {
      fetch('/api/agents').then((r) => r.json()).then((d) => setAgents(d.agents || [])).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Agent Status Board</h1>
      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-xs">
              <th className="text-left p-3">Agent ID</th>
              <th className="text-left p-3">Company</th>
              <th className="text-left p-3">State</th>
              <th className="text-left p-3">Task</th>
              <th className="text-left p-3">Model</th>
              <th className="text-left p-3">Last Active</th>
              <th className="text-left p-3">Autonomy</th>
              <th className="text-left p-3">Sessions</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent) => (
              <>
                <tr
                  key={agent.id}
                  className="border-b border-gray-800/50 hover:bg-gray-800/30 cursor-pointer"
                  onClick={() => setExpanded(expanded === agent.id ? null : agent.id)}
                >
                  <td className="p-3 font-mono text-xs text-cyan-400">{agent.id}</td>
                  <td className="p-3 text-xs">{agent.company}</td>
                  <td className="p-3"><StateBadge state={agent.state} /></td>
                  <td className="p-3 text-xs text-gray-300 truncate max-w-[200px]">{agent.task || '—'}</td>
                  <td className="p-3 font-mono text-xs text-gray-400">{agent.model || '—'}</td>
                  <td className="p-3 text-xs text-gray-400">
                    {agent.lastActive ? new Date(agent.lastActive).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never'}
                  </td>
                  <td className="p-3 text-xs">
                    {agent.avgAutonomyScore ? (
                      <span className={Number(agent.avgAutonomyScore) >= 7 ? 'text-green-400' : Number(agent.avgAutonomyScore) >= 4 ? 'text-yellow-400' : 'text-red-400'}>
                        {agent.avgAutonomyScore}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="p-3 text-xs text-gray-400">{agent.sessionCount}</td>
                </tr>
                {expanded === agent.id && (
                  <tr key={`${agent.id}-preview`}>
                    <td colSpan={8} className="p-4 bg-gray-950 border-b border-gray-800">
                      <pre className="text-xs text-gray-400 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
                        {agent.memoryPreview || 'No memory data available'}
                      </pre>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
        {agents.length === 0 && (
          <div className="p-8 text-center text-gray-500">Loading agents...</div>
        )}
      </div>
    </div>
  );
}
