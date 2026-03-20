/**
 * Usage API — ONXZA Mission Control
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */
import { NextResponse } from 'next/server';
import path from 'path';
import { WORKSPACE_PATH, readJsonlFile } from '@/lib/fs-utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  const logPath = path.join(WORKSPACE_PATH, 'logs', 'api-call-log.jsonl');
  const entries = readJsonlFile(logPath);

  const today = new Date().toISOString().slice(0, 10);
  const todayEntries = entries.filter((e) => String(e.timestamp || '').startsWith(today));

  let totalCost = 0;
  let totalTokens = 0;
  const modelCosts: Record<string, number> = {};
  const agentUsage: Record<string, { model: string; calls: number; tokensIn: number; tokensOut: number; cost: number }> = {};
  const uniqueAgents = new Set<string>();

  for (const entry of todayEntries) {
    const cost = Number(entry.cost) || 0;
    const tokensIn = Number(entry.tokens_in) || 0;
    const tokensOut = Number(entry.tokens_out) || 0;
    const model = String(entry.model || 'unknown');
    const agentId = String(entry.agent_id || 'unknown');

    totalCost += cost;
    totalTokens += tokensIn + tokensOut;
    modelCosts[model] = (modelCosts[model] || 0) + cost;
    uniqueAgents.add(agentId);

    if (!agentUsage[agentId]) {
      agentUsage[agentId] = { model, calls: 0, tokensIn: 0, tokensOut: 0, cost: 0 };
    }
    agentUsage[agentId].calls++;
    agentUsage[agentId].tokensIn += tokensIn;
    agentUsage[agentId].tokensOut += tokensOut;
    agentUsage[agentId].cost += cost;
  }

  const agentTable = Object.entries(agentUsage)
    .map(([id, data]) => ({ agent: id, ...data }))
    .sort((a, b) => b.cost - a.cost);

  return NextResponse.json({
    stats: {
      totalCostToday: totalCost.toFixed(4),
      totalTokens,
      apiCalls: todayEntries.length,
      uniqueAgents: uniqueAgents.size,
    },
    modelCosts,
    agentTable,
  });
}
