/**
 * Agents API — ONXZA Mission Control
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { OPENCLAW_HOME, WORKSPACE_PATH, readJsonlFile, readFileContent, getFileMtime, listDirs, listFiles } from '@/lib/fs-utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  const agents: Record<string, unknown>[] = [];
  const autonomyScores = readJsonlFile(path.join(WORKSPACE_PATH, 'logs', 'quality', 'autonomy-scores.jsonl'));
  const agentDirs = listDirs(path.join(OPENCLAW_HOME, 'agents'));

  for (const agentId of agentDirs) {
    const wsDir = path.join(OPENCLAW_HOME, `workspace-${agentId}`);
    const memPath = path.join(wsDir, 'MEMORY.md');
    const memContent = readFileContent(memPath);
    const mtime = getFileMtime(memPath);

    let state = 'NEVER RUN';
    let company = '';
    let task = '';
    let model = '';

    if (memContent) {
      state = 'IDLE';
      const hoursAgo = mtime ? (Date.now() - mtime.getTime()) / (1000 * 60 * 60) : null;
      if (hoursAgo !== null && hoursAgo < 1) state = 'ACTIVE';

      const companyMatch = memContent.match(/company[:\s]+(\w+)/i);
      company = companyMatch?.[1] || agentId.split('-')[0]?.toUpperCase() || '';

      const taskMatch = memContent.match(/TASK_ID[:\s]+(.+)/i);
      task = taskMatch?.[1]?.trim() || '';
    }

    // Read agent config
    const configPath = path.join(OPENCLAW_HOME, 'agents', agentId, 'agent');
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        model = config.model || '';
        if (!company && config.company) company = config.company;
      } catch {
        // ignore
      }
    }

    // Count sessions
    const sessionsDir = path.join(OPENCLAW_HOME, 'agents', agentId, 'sessions');
    const sessionCount = listFiles(sessionsDir).length;

    // Calculate avg autonomy score
    const agentScores = autonomyScores
      .filter((s) => String(s.agent) === agentId)
      .map((s) => Number(s.score))
      .filter((n) => !isNaN(n));
    const avgScore = agentScores.length > 0
      ? (agentScores.reduce((a, b) => a + b, 0) / agentScores.length).toFixed(1)
      : null;

    agents.push({
      id: agentId,
      company: company || agentId.split('-')[0]?.toUpperCase(),
      state,
      task,
      model,
      lastActive: mtime?.toISOString() || null,
      avgAutonomyScore: avgScore,
      sessionCount,
      memoryPreview: memContent ? memContent.slice(0, 500) : '',
    });
  }

  return NextResponse.json({ agents });
}
