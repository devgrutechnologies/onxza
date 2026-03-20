/**
 * API Route: /api/cdp
 * Returns CDP (Collaborative Definition Protocol) session data.
 *
 * GET /api/cdp           — list all sessions
 * GET /api/cdp?id=<id>   — detail for one session
 *
 * Reads workspace/logs/cdp-sessions/*.json directly.
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 * Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
 */
import { NextRequest, NextResponse } from 'next/server';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

const WORKSPACE = join(process.env.OPENCLAW_HOME || join(process.env.HOME || '~', '.openclaw'), 'workspace');
const CDP_DIR   = join(WORKSPACE, 'logs', 'cdp-sessions');

interface CdpSession {
  id: string;
  project_slug: string;
  company: string;
  vision_type: string;
  state: string;
  created_at: string;
  updated_at: string;
  avg_confidence: number;
  questions: string[];
  answers: Record<string, string>;
  vision_md_path: string | null;
  checkpoint_id: string | null;
  approved_at: string | null;
  board_roles: string[];
}

async function loadSessions(): Promise<CdpSession[]> {
  const sessions: CdpSession[] = [];
  try {
    const files = await readdir(CDP_DIR);
    for (const f of files) {
      if (!f.endsWith('.json')) continue;
      try {
        const raw = await readFile(join(CDP_DIR, f), 'utf-8');
        sessions.push(JSON.parse(raw));
      } catch { /* skip */ }
    }
  } catch { /* no sessions dir */ }
  return sessions.sort((a, b) => (b.created_at > a.created_at ? 1 : -1));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  const sessions = await loadSessions();

  if (id) {
    const s = sessions.find(s => s.id === id);
    if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(s);
  }

  const summary = {
    total: sessions.length,
    approved: sessions.filter(s => s.state === 'APPROVED').length,
    in_review: sessions.filter(s => s.state === 'CDP-REVIEW').length,
    awaiting_answers: sessions.filter(s => s.state === 'AWAITING-ANSWERS').length,
    draft: sessions.filter(s => s.state === 'DRAFT').length,
  };

  return NextResponse.json({ sessions, summary, generated_at: new Date().toISOString() });
}
