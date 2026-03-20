/**
 * FVP Loop Tracker API — ONXZA Mission Control
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */
import { NextResponse } from 'next/server';
import path from 'path';
import { WORKSPACE_PATH, readJsonlFile } from '@/lib/fs-utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  const logPath = path.join(WORKSPACE_PATH, 'logs', 'dispatch-log.jsonl');
  const entries = readJsonlFile(logPath);

  const agentData: Record<string, {
    totalDispatches: number;
    tickets: Set<string>;
    ticketCounts: Record<string, number>;
    lastDispatch: string;
  }> = {};

  for (const entry of entries) {
    const agent = String(entry.assigned_to || 'unknown');
    const ticketId = String(entry.ticket_id || '');
    const ts = String(entry.timestamp || '');

    if (!agentData[agent]) {
      agentData[agent] = { totalDispatches: 0, tickets: new Set(), ticketCounts: {}, lastDispatch: '' };
    }
    agentData[agent].totalDispatches++;
    agentData[agent].tickets.add(ticketId);
    agentData[agent].ticketCounts[ticketId] = (agentData[agent].ticketCounts[ticketId] || 0) + 1;
    if (ts > agentData[agent].lastDispatch) agentData[agent].lastDispatch = ts;
  }

  const table = Object.entries(agentData).map(([agent, data]) => {
    const loopsDetected = Object.values(data.ticketCounts).filter((c) => c > 1).length;
    return {
      agent,
      totalDispatches: data.totalDispatches,
      uniqueTickets: data.tickets.size,
      loopsDetected,
      lastDispatch: data.lastDispatch,
    };
  }).sort((a, b) => b.loopsDetected - a.loopsDetected);

  return NextResponse.json({ fvpData: table });
}
