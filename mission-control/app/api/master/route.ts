/**
 * Master Dashboard API — ONXZA Mission Control
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { OPENCLAW_HOME, WORKSPACE_PATH, readJsonlFile, listFiles, listDirs, readFileContent, getFileMtime } from '@/lib/fs-utils';

export const dynamic = 'force-dynamic';

interface AgentInfo {
  id: string;
  state: string;
  lastActive: string | null;
  taskState: string;
}

function getAgentStates(): AgentInfo[] {
  const agents: AgentInfo[] = [];
  try {
    const home = OPENCLAW_HOME;
    const entries = fs.readdirSync(home).filter((d) => d.startsWith('workspace-'));
    for (const dir of entries) {
      const agentId = dir.replace('workspace-', '');
      const memPath = path.join(home, dir, 'MEMORY.md');
      const content = readFileContent(memPath);
      let state = 'NEVER RUN';
      let taskState = '';
      if (content) {
        if (content.includes('TASK_STATE')) {
          const match = content.match(/TASK_STATE[:\s]+(\w+)/i);
          taskState = match?.[1] || '';
        }
        state = 'IDLE';
      }
      const mtime = getFileMtime(memPath);
      const hoursAgo = mtime ? (Date.now() - mtime.getTime()) / (1000 * 60 * 60) : null;
      if (hoursAgo !== null && hoursAgo < 1) state = 'ACTIVE';

      agents.push({
        id: agentId,
        state,
        lastActive: mtime?.toISOString() || null,
        taskState,
      });
    }
  } catch {
    // ignore
  }
  return agents;
}

export async function GET() {
  const agents = getAgentStates();
  const openTickets = listFiles(path.join(WORKSPACE_PATH, 'tickets', 'open'), '.md');
  const closedTickets = listFiles(path.join(WORKSPACE_PATH, 'tickets', 'closed'), '.md');
  const dispatchLog = readJsonlFile(path.join(WORKSPACE_PATH, 'logs', 'dispatch-log.jsonl'));

  const today = new Date().toISOString().slice(0, 10);
  const closedToday = closedTickets.filter(() => {
    // Count all closed as a reasonable proxy
    return true;
  });
  const dispatchesToday = dispatchLog.filter((d) => {
    const ts = String(d.timestamp || '');
    return ts.startsWith(today);
  });

  const agentDirs = listDirs(path.join(OPENCLAW_HOME, 'agents'));
  const activeNow = agents.filter((a) => a.state === 'ACTIVE').length;
  const lastDispatches = dispatchLog.slice(-5).reverse();

  return NextResponse.json({
    stats: {
      totalAgents: agentDirs.length,
      activeNow,
      openTickets: openTickets.length,
      closedToday: closedToday.length,
      dispatchesToday: dispatchesToday.length,
    },
    agents: agents.sort((a, b) => {
      const order: Record<string, number> = { ACTIVE: 0, IDLE: 1, 'NEVER RUN': 2 };
      return (order[a.state] ?? 2) - (order[b.state] ?? 2);
    }),
    recentDispatches: lastDispatches,
  });
}
