/**
 * Agent Activity API — ONXZA Mission Control
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { OPENCLAW_HOME, readFileContent, getFileMtime } from '@/lib/fs-utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  const agents: { id: string; state: string; lastSeen: string | null; company: string }[] = [];

  try {
    const entries = fs.readdirSync(OPENCLAW_HOME).filter((d) => d.startsWith('workspace-'));
    for (const dir of entries) {
      const agentId = dir.replace('workspace-', '');
      const memPath = path.join(OPENCLAW_HOME, dir, 'MEMORY.md');
      const content = readFileContent(memPath);
      const mtime = getFileMtime(memPath);

      let state = 'NEVER_RUN';
      if (content) {
        state = 'IDLE';
        const hoursAgo = mtime ? (Date.now() - mtime.getTime()) / (1000 * 60 * 60) : null;
        if (hoursAgo !== null && hoursAgo < 1) state = 'ACTIVE';
      }

      agents.push({
        id: agentId,
        state,
        lastSeen: mtime?.toISOString() || null,
        company: agentId.split('-')[0]?.toUpperCase() || '',
      });
    }
  } catch {
    // ignore
  }

  return NextResponse.json({ agents });
}
