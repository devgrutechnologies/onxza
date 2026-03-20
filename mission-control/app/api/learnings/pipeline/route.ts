/**
 * API Route: /api/learnings/pipeline
 * Returns shared learnings pipeline state:
 *   - Pending skill_approval_request tickets (review queue)
 *   - Tier breakdown (count per company + global)
 *   - Recently promoted (promoted_at set, promoted_from != none)
 *   - Type breakdown
 *
 * Reads workspace directly. No DB, no LLM.
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 * Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
 */
import { NextResponse } from 'next/server';
import { readdir, readFile, stat } from 'fs/promises';
import { join, relative, basename } from 'path';

const OPENCLAW_HOME  = process.env.OPENCLAW_HOME || join(process.env.HOME || '~', '.openclaw');
const WORKSPACE      = join(OPENCLAW_HOME, 'workspace');
const LEARNINGS_DIR  = join(WORKSPACE, 'shared-learnings');
const TICKETS_OPEN   = join(WORKSPACE, 'tickets', 'open');

function parseFrontmatter(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = content.split('\n');
  let inFm = false;
  for (const line of lines) {
    if (line.trim() === '---') {
      if (!inFm) { inFm = true; continue; }
      else break;
    }
    if (inFm) {
      const m = line.match(/^(\w+):\s*(.*)$/);
      if (m) result[m[1]] = m[2].trim();
    }
  }
  return result;
}

async function walkMdFiles(dir: string): Promise<string[]> {
  const results: string[] = [];
  let entries: string[];
  try { entries = await readdir(dir); } catch { return results; }
  for (const e of entries) {
    if (e.startsWith('.') || e === 'node_modules') continue;
    const full = join(dir, e);
    try {
      const s = await stat(full);
      if (s.isDirectory()) results.push(...await walkMdFiles(full));
      else if (e.endsWith('.md') && e !== 'README.md') results.push(full);
    } catch { /* skip */ }
  }
  return results;
}

async function getPendingReviewTickets() {
  const results = [];
  try {
    const files = await readdir(TICKETS_OPEN);
    for (const f of files) {
      if (!f.includes('skill-approval') && !f.includes('SAR')) continue;
      try {
        const raw = await readFile(join(TICKETS_OPEN, f), 'utf-8');
        const fm = parseFrontmatter(raw);
        if (fm.type !== 'skill_approval_request') continue;
        results.push({
          ticket_id: fm.id || f,
          company: fm.company || '?',
          learning_type: fm.learning_type || '?',
          learning_file: fm.learning_file || '',
          submitted_by: fm.submitting_agent || fm.created_by || '?',
          assigned_to: fm.assigned_to || '?',
          created_at: fm.created_at || '',
        });
      } catch { /* skip */ }
    }
  } catch { /* no tickets dir */ }
  return results;
}

export async function GET() {
  const allFiles = await walkMdFiles(LEARNINGS_DIR);

  const tierCounts: Record<string, number> = { DTP: 0, WDC: 0, MGA: 0, global: 0, other: 0 };
  const typeCounts: Record<string, number> = {};
  const recentlyPromoted = [];

  for (const fpath of allFiles) {
    const rel = relative(WORKSPACE, fpath);
    let content = '';
    try { content = await readFile(fpath, 'utf-8'); } catch { continue; }
    const fm = parseFrontmatter(content);

    // Infer company from path
    const parts = rel.replace('shared-learnings/', '').split('/');
    const inferredCompany = parts[0]?.toUpperCase() || 'other';
    const company = (fm.company || inferredCompany).toUpperCase();

    if (company in tierCounts) tierCounts[company]++;
    else tierCounts.other++;

    const ltype = fm.type || 'unknown';
    typeCounts[ltype] = (typeCounts[ltype] || 0) + 1;

    // Promoted learnings
    if (fm.promoted_at && fm.promoted_at !== 'none' && fm.promoted_from && fm.promoted_from !== 'none') {
      recentlyPromoted.push({
        path: rel,
        filename: basename(fpath),
        promoted_at: fm.promoted_at,
        promoted_from: fm.promoted_from,
        promoted_by: fm.promoted_by || '?',
        type: ltype,
        company,
      });
    }
  }

  // Sort recent promotions by date desc
  recentlyPromoted.sort((a, b) => (b.promoted_at > a.promoted_at ? 1 : -1));

  const pendingReview = await getPendingReviewTickets();

  return NextResponse.json({
    total_files: allFiles.length,
    tier_counts: tierCounts,
    type_counts: typeCounts,
    pending_review: pendingReview,
    recently_promoted: recentlyPromoted.slice(0, 20),
    generated_at: new Date().toISOString(),
  });
}
