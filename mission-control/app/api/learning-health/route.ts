/**
 * Learning Health API — ONXZA Mission Control
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */
import { NextResponse } from 'next/server';
import path from 'path';
import { WORKSPACE_PATH, readJsonlFile, walkFiles, listFiles } from '@/lib/fs-utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  const autonomyScores = readJsonlFile(path.join(WORKSPACE_PATH, 'logs', 'quality', 'autonomy-scores.jsonl'));
  const dispatchLog = readJsonlFile(path.join(WORKSPACE_PATH, 'logs', 'dispatch-log.jsonl'));
  const learningFiles = walkFiles(path.join(WORKSPACE_PATH, 'shared-learnings'), '.md');
  const closedTickets = listFiles(path.join(WORKSPACE_PATH, 'tickets', 'closed'), '.md');

  const scores = autonomyScores.map((s) => Number(s.score)).filter((n) => !isNaN(n));
  const avgScore = scores.length > 0
    ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
    : '0';

  const today = new Date().toISOString().slice(0, 10);
  const dispatchesToday = dispatchLog.filter((d) => String(d.timestamp || '').startsWith(today)).length;

  return NextResponse.json({
    trainingReviews: autonomyScores.length,
    sharedLearnings: learningFiles.length,
    dispatchesToday,
    closedTickets: closedTickets.length,
    avgAutonomyScore: avgScore,
  });
}
