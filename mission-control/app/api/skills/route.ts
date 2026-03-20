/**
 * Skills API — ONXZA Mission Control
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { listDirs, readFileContent } from '@/lib/fs-utils';

export const dynamic = 'force-dynamic';

const SKILLS_DIR = '/opt/homebrew/lib/node_modules/openclaw/skills';

export async function GET() {
  const skills: { name: string; description: string; hasSkillMd: boolean }[] = [];
  const dirs = listDirs(SKILLS_DIR);

  for (const name of dirs) {
    const skillMdPath = path.join(SKILLS_DIR, name, 'SKILL.md');
    const hasSkillMd = fs.existsSync(skillMdPath);
    let description = '';
    if (hasSkillMd) {
      const content = readFileContent(skillMdPath);
      const lines = content.split('\n').filter((l) => l.trim());
      // First non-empty, non-heading line as description
      for (const line of lines) {
        if (!line.startsWith('#') && !line.startsWith('---')) {
          description = line.trim();
          break;
        }
      }
    }
    skills.push({ name, description, hasSkillMd });
  }

  return NextResponse.json({ skills });
}
