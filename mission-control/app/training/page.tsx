/**
 * Training Dashboard — ONXZA Mission Control
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */
'use client';

import { useEffect, useState } from 'react';

interface AgentActivity {
  id: string;
  state: string;
  lastSeen: string | null;
  company: string;
}

interface TrainingRow {
  agentId: string;
  sessionCount: number;
  reviewCount: number;
  avgScore: string;
  trainingState: string;
}

interface QcItem {
  id: string;
  priority: string;
  assignedTo: string;
  summary: string;
  ageHours: number | null;
}

interface HealthData {
  trainingReviews: number;
  sharedLearnings: number;
  dispatchesToday: number;
  closedTickets: number;
  avgAutonomyScore: string;
}

const STATE_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-900 text-green-300',
  IDLE: 'bg-yellow-900 text-yellow-300',
  NEVER_RUN: 'bg-red-950 text-red-300',
  UNKNOWN: 'bg-gray-800 text-gray-400',
};

const TRAINING_COLORS: Record<string, string> = {
  GRADUATED: 'bg-green-950 text-green-300',
  IN_TRAINING: 'bg-yellow-950 text-yellow-300',
  NEVER_RUN: 'bg-red-950 text-red-300',
};

const PRIORITY_COLORS: Record<string, string> = {
  immediate: 'bg-red-900 text-red-300',
  critical: 'bg-red-900 text-red-300',
  high: 'bg-orange-900 text-orange-300',
  today: 'bg-orange-900 text-orange-300',
  normal: 'bg-gray-800 text-gray-300',
};

export default function TrainingPage() {
  const [agents, setAgents] = useState<AgentActivity[]>([]);
  const [training, setTraining] = useState<TrainingRow[]>([]);
  const [qcQueue, setQcQueue] = useState<QcItem[]>([]);
  const [health, setHealth] = useState<HealthData | null>(null);

  useEffect(() => {
    const fetchAll = () => {
      fetch('/api/agent-activity').then((r) => r.json()).then((d) => setAgents(d.agents || [])).catch(() => {});
      fetch('/api/training-status').then((r) => r.json()).then((d) => setTraining(d.trainingData || [])).catch(() => {});
      fetch('/api/qc-queue').then((r) => r.json()).then((d) => setQcQueue(d.qcItems || [])).catch(() => {});
      fetch('/api/learning-health').then((r) => r.json()).then(setHealth).catch(() => {});
    };
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatAge = (hours: number | null): string => {
    if (hours === null) return '';
    if (hours < 1) return '<1h';
    if (hours < 24) return `${Math.round(hours)}h`;
    return `${Math.round(hours / 24)}d`;
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Training Dashboard</h1>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Panel 1: Learning Health */}
        <div className="p-6 bg-gray-900 rounded-lg border border-gray-800">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-300 mb-4">Learning Health</h2>
          {health ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="text-center p-3 bg-gray-800 rounded">
                <div className="text-xl font-bold text-cyan-400">{health.trainingReviews}</div>
                <div className="text-[10px] text-gray-400 mt-1">Reviews</div>
              </div>
              <div className="text-center p-3 bg-gray-800 rounded">
                <div className="text-xl font-bold text-blue-400">{health.sharedLearnings}</div>
                <div className="text-[10px] text-gray-400 mt-1">Learnings</div>
              </div>
              <div className="text-center p-3 bg-gray-800 rounded">
                <div className="text-xl font-bold text-purple-400">{health.dispatchesToday}</div>
                <div className="text-[10px] text-gray-400 mt-1">Dispatches</div>
              </div>
              <div className="text-center p-3 bg-gray-800 rounded">
                <div className="text-xl font-bold text-green-400">{health.closedTickets}</div>
                <div className="text-[10px] text-gray-400 mt-1">Closed</div>
              </div>
              <div className="text-center p-3 bg-gray-800 rounded">
                <div className={`text-xl font-bold ${Number(health.avgAutonomyScore) >= 7 ? 'text-green-400' : Number(health.avgAutonomyScore) >= 4 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {health.avgAutonomyScore}
                </div>
                <div className="text-[10px] text-gray-400 mt-1">Avg Score</div>
              </div>
            </div>
          ) : (
            <div className="text-gray-500 text-sm">Loading...</div>
          )}
        </div>

        {/* Panel 2: Live Agent Activity */}
        <div className="p-6 bg-gray-900 rounded-lg border border-gray-800">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-300 mb-4">Live Agent Activity</h2>
          <div className="max-h-60 overflow-y-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 border-b border-gray-800">
                  <th className="text-left pb-2">Agent</th>
                  <th className="text-left pb-2">State</th>
                  <th className="text-left pb-2">Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {agents.slice(0, 20).map((a) => (
                  <tr key={a.id} className="border-b border-gray-800/30">
                    <td className="py-1.5 font-mono text-cyan-400">{a.id}</td>
                    <td className="py-1.5">
                      <span className={`px-1.5 py-0.5 text-[10px] rounded ${STATE_COLORS[a.state] || STATE_COLORS.UNKNOWN}`}>{a.state}</span>
                    </td>
                    <td className="py-1.5 text-gray-400">
                      {a.lastSeen ? new Date(a.lastSeen).toLocaleTimeString('en-US', { hour12: false }) : 'Never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel 3: Training Mode Tracker */}
        <div className="p-6 bg-gray-900 rounded-lg border border-gray-800">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-300 mb-4">Training Mode Tracker</h2>
          <div className="max-h-72 overflow-y-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 border-b border-gray-800">
                  <th className="text-left pb-2">Agent</th>
                  <th className="text-left pb-2">State</th>
                  <th className="text-right pb-2">Sessions</th>
                  <th className="text-right pb-2">Reviews</th>
                  <th className="text-right pb-2">Avg Score</th>
                  <th className="pb-2 w-24">Progress</th>
                </tr>
              </thead>
              <tbody>
                {training.map((t) => {
                  const progress = Math.min(t.reviewCount / 10 * 100, 100);
                  const barColor = progress >= 100 ? 'bg-green-500' : progress >= 50 ? 'bg-yellow-500' : 'bg-red-500';
                  return (
                    <tr key={t.agentId} className="border-b border-gray-800/30">
                      <td className="py-1.5 font-mono text-cyan-400">{t.agentId}</td>
                      <td className="py-1.5">
                        <span className={`px-1.5 py-0.5 text-[10px] rounded ${TRAINING_COLORS[t.trainingState] || TRAINING_COLORS.NEVER_RUN}`}>
                          {t.trainingState}
                        </span>
                      </td>
                      <td className="py-1.5 text-right text-gray-400">{t.sessionCount}</td>
                      <td className="py-1.5 text-right text-gray-400">{t.reviewCount}</td>
                      <td className="py-1.5 text-right">
                        <span className={Number(t.avgScore) >= 7 ? 'text-green-400' : Number(t.avgScore) >= 4 ? 'text-yellow-400' : 'text-red-400'}>
                          {t.avgScore}
                        </span>
                      </td>
                      <td className="py-1.5">
                        <div className="w-full bg-gray-800 rounded-full h-2">
                          <div className={`h-2 rounded-full ${barColor}`} style={{ width: `${progress}%` }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel 4: QC Review Queue */}
        <div className="p-6 bg-gray-900 rounded-lg border border-gray-800">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-300 mb-4">QC Review Queue</h2>
          <div className="max-h-72 overflow-y-auto space-y-2">
            {qcQueue.length > 0 ? qcQueue.map((item) => (
              <div key={item.id} className="p-3 bg-gray-800 rounded border border-gray-700 hover:border-gray-600 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-[10px] text-cyan-400">{item.id}</span>
                  <span className={`px-1.5 py-0.5 text-[10px] rounded ${PRIORITY_COLORS[item.priority] || PRIORITY_COLORS.normal}`}>
                    {item.priority}
                  </span>
                  {item.ageHours !== null && (
                    <span className={`text-[10px] ml-auto ${item.ageHours > 24 ? 'text-red-400' : 'text-gray-500'}`}>
                      {formatAge(item.ageHours)} ago
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-300 line-clamp-1">{item.summary}</div>
                {item.assignedTo && <div className="text-[10px] text-gray-500 mt-1 font-mono">{item.assignedTo}</div>}
              </div>
            )) : (
              <div className="text-sm text-gray-500 text-center py-4">No QC items in queue</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
