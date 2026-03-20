/**
 * Learnings API — ONXZA Mission Control
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */
import { NextResponse } from 'next/server';
import path from 'path';
import { WORKSPACE_PATH, walkFiles, readFrontmatter } from '@/lib/fs-utils';

export const dynamic = 'force-dynamic';

interface Learning {
  path: string;
  relativePath: string;
  filename: string;
  meta: Record<string, string>;
  preview: string;
}

export async function GET() {
  const learningsDir = path.join(WORKSPACE_PATH, 'shared-learnings');
  const files = walkFiles(learningsDir, '.md');

  const learnings: Learning[] = files.map((f) => {
    const parsed = readFrontmatter(f);
    const relativePath = f.replace(learningsDir + '/', '');
    return {
      path: f,
      relativePath,
      filename: path.basename(f),
      meta: parsed?.meta || {},
      preview: (parsed?.body || '').slice(0, 200),
    };
  });

  // Build tree structure
  const tree: Record<string, string[]> = {};
  for (const l of learnings) {
    const dir = path.dirname(l.relativePath);
    if (!tree[dir]) tree[dir] = [];
    tree[dir].push(l.filename);
  }

  return NextResponse.json({ learnings, tree });
}
