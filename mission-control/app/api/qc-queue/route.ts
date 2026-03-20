/**
 * QC Queue API — ONXZA Mission Control
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */
import { NextResponse } from 'next/server';
import path from 'path';
import { WORKSPACE_PATH, listFiles, readFrontmatter, getFileAge } from '@/lib/fs-utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  const openDir = path.join(WORKSPACE_PATH, 'tickets', 'open');
  const files = listFiles(openDir, '.md');

  const qcItems = files
    .map((f) => {
      const filePath = path.join(openDir, f);
      const parsed = readFrontmatter(filePath);
      const meta = parsed?.meta || {};
      return {
        id: meta.ticket_id || f.replace('.md', ''),
        type: meta.type || '',
        priority: meta.priority || 'normal',
        assignedTo: meta.assigned_to || '',
        summary: meta.summary || f,
        ageHours: getFileAge(filePath),
      };
    })
    .filter((t) => t.type === 'qc_review_request' || t.type === 'qc_review');

  return NextResponse.json({ qcItems });
}
