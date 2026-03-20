/**
 * Training Status API — ONXZA Mission Control
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */
import { NextResponse } from 'next/server';
import path from 'path';
import { OPENCLAW_HOME, WORKSPACE_PATH, readJsonlFile, listDirs, listFiles } from '@/lib/fs-utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  const autonomyScores = readJsonlFile(path.join(WORKSPACE_PATH, 'logs', 'quality', 'autonomy-scores.jsonl'));
  const agentDirs = listDirs(path.join(OPENCLAW_HOME, 'agents'));

  const trainingData = agentDirs.map((agentId) => {
    const sessionsDir = path.join(OPENCLAW_HOME, 'agents', agentId, 'sessions');
    const sessionCount = listFiles(sessionsDir).length;

    const scores = autonomyScores
      .filter((s) => String(s.agent) === agentId)
      .map((s) => Number(s.score))
      .filter((n) => !isNaN(n));

    const avgScore = scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0;

    const reviewCount = scores.length;
    let trainingState = 'NEVER_RUN';
    if (sessionCount > 0) trainingState = reviewCount >= 10 ? 'GRADUATED' : 'IN_TRAINING';

    return {
      agentId,
      sessionCount,
      reviewCount,
      avgScore: avgScore.toFixed(1),
      trainingState,
    };
  });

  return NextResponse.json({ trainingData });
}
