/**
 * API Route: /api/memory-logs
 * Returns session memory log state across agents:
 *   - Per-agent: daily log count, consolidated count, pending count, last log date
 *   - Recent session entries across all agents (for activity feed)
 *   - Fleet-level summary
 *
 * Query params:
 *   ?agent=<id>        filter to a specific agent
 *   ?limit=<n>         max recent entries (default 20)
 *
 * Reads ~/.openclaw/workspace-[agent-id]/memory/ directly. No DB, no LLM.
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 * Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
 */
import { NextRequest, NextResponse } from 'next/server';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

const OPENCLAW_HOME = process.env.OPENCLAW_HOME || join(process.env.HOME || '~', '.openclaw');

interface AgentMemoryStatus {
  agent_id: string;
  daily_files: number;
  consolidated: number;
  pending: number;
  last_log_date: string | null;
  key_learnings: number;
  memory_md_size: number;
}

interface SessionEntry {
  agent_id: string;
  date: string;
  session_id: string;
  ticket: string;
  what: string;
  learned: string;
  file: string;
}

async function getAgentWorkspaces(filterAgent?: string): Promise<{ id: string; dir: string }[]> {
  const results: { id: string; dir: string }[] = [];
  try {
    const entries = await readdir(OPENCLAW_HOME);
    for (const e of entries) {
      if (!e.startsWith('workspace-') || e === 'workspace') continue;
      const agentId = e.replace('workspace-', '');
      if (filterAgent && agentId !== filterAgent) continue;
      const dir = join(OPENCLAW_HOME, e);
      results.push({ id: agentId, dir });
    }
  } catch { /* ok */ }
  return results;
}

async function getAgentMemoryStatus(agentId: string, wsDir: string): Promise<AgentMemoryStatus> {
  const memDir = join(wsDir, 'memory');
  const memoryMd = join(wsDir, 'MEMORY.md');

  let dailyFiles = 0;
  let consolidated = 0;
  let pending = 0;
  let lastLogDate: string | null = null;

  try {
    const files = await readdir(memDir);
    const dailyPattern = /^\d{4}-\d{2}-\d{2}.*\.md$/;
    for (const f of files) {
      if (!dailyPattern.test(f)) continue;
      dailyFiles++;
      const content = await readFile(join(memDir, f), 'utf-8').catch(() => '');
      if (/^consolidated:\s*true/m.test(content)) consolidated++;
      else pending++;
      const dateMatch = f.match(/^(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        if (!lastLogDate || dateMatch[1] > lastLogDate) lastLogDate = dateMatch[1];
      }
    }
  } catch { /* no memory dir */ }

  let keyLearnings = 0;
  let memoryMdSize = 0;
  try {
    const content = await readFile(memoryMd, 'utf-8');
    memoryMdSize = Buffer.byteLength(content, 'utf-8');
    keyLearnings = content.split('\n').filter(l => l.trim().startsWith('- ') && l.length > 10).length;
  } catch { /* ok */ }

  return { agent_id: agentId, daily_files: dailyFiles, consolidated, pending, last_log_date: lastLogDate, key_learnings: keyLearnings, memory_md_size: memoryMdSize };
}

async function getRecentEntries(wsDir: string, agentId: string, limit: number): Promise<SessionEntry[]> {
  const memDir = join(wsDir, 'memory');
  const entries: SessionEntry[] = [];
  try {
    const files = (await readdir(memDir)).filter(f => /^\d{4}-\d{2}-\d{2}.*\.md$/.test(f)).sort().reverse();
    for (const f of files.slice(0, 3)) {
      const content = await readFile(join(memDir, f), 'utf-8').catch(() => '');
      // Split by ## DATE entries
      const sections = content.split(/\n(?=## \d{4}-\d{2}-\d{2})/);
      for (const section of sections) {
        if (!section.trim()) continue;
        const sessionMatch = section.match(/^## (\d{4}-\d{2}-\d{2}) — ([\w-]+)/);
        if (!sessionMatch) continue;
        const ticketMatch = section.match(/\*\*Ticket:\*\*\s*(.+)/);
        const whatMatch = section.match(/### What happened\n([\s\S]*?)(?=\n###|\n## |\Z)/);
        const learnedMatch = section.match(/### What I learned\n([\s\S]*?)(?=\n###|\n## |\Z)/);
        const what = whatMatch?.[1]?.trim().slice(0, 120) || '';
        const learned = learnedMatch?.[1]?.trim().slice(0, 120) || '';
        if (!what || what === '(not specified)') continue;
        entries.push({
          agent_id: agentId,
          date: sessionMatch[1],
          session_id: sessionMatch[2],
          ticket: ticketMatch?.[1]?.trim() || 'none',
          what,
          learned,
          file: `memory/${f}`,
        });
        if (entries.length >= limit) break;
      }
      if (entries.length >= limit) break;
    }
  } catch { /* ok */ }
  return entries;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filterAgent = searchParams.get('agent') || undefined;
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  const workspaces = await getAgentWorkspaces(filterAgent);
  const statuses: AgentMemoryStatus[] = [];
  const allEntries: SessionEntry[] = [];

  await Promise.all(workspaces.map(async ({ id, dir }) => {
    const [status, entries] = await Promise.all([
      getAgentMemoryStatus(id, dir),
      getRecentEntries(dir, id, 5),
    ]);
    statuses.push(status);
    allEntries.push(...entries);
  }));

  // Sort entries by date desc
  allEntries.sort((a, b) => (b.date > a.date ? 1 : -1));

  const totalPending = statuses.reduce((s, a) => s + a.pending, 0);
  const totalDailyFiles = statuses.reduce((s, a) => s + a.daily_files, 0);
  const totalLearnings = statuses.reduce((s, a) => s + a.key_learnings, 0);
  const agentsWithLogs = statuses.filter(a => a.daily_files > 0).length;

  return NextResponse.json({
    agents: statuses.sort((a, b) => (b.last_log_date || '') > (a.last_log_date || '') ? 1 : -1),
    recent_entries: allEntries.slice(0, limit),
    summary: {
      total_agents: statuses.length,
      agents_with_logs: agentsWithLogs,
      total_daily_files: totalDailyFiles,
      total_pending: totalPending,
      total_key_learnings: totalLearnings,
    },
    generated_at: new Date().toISOString(),
  });
}
