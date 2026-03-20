/**
 * Filesystem Utilities — ONXZA Mission Control
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */
import fs from 'fs';
import path from 'path';

export const OPENCLAW_HOME = process.env.OPENCLAW_HOME || path.join(process.env.HOME || '', '.openclaw');
export const WORKSPACE_PATH = process.env.WORKSPACE_PATH || path.join(OPENCLAW_HOME, 'workspace');

export function readJsonlFile(filePath: string): Record<string, unknown>[] {
  try {
    if (!fs.existsSync(filePath)) return [];
    const content = fs.readFileSync(filePath, 'utf-8');
    return content
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean) as Record<string, unknown>[];
  } catch {
    return [];
  }
}

export function readFrontmatter(filePath: string): { meta: Record<string, string>; body: string } | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf-8');
    const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (!match) return { meta: {}, body: content };
    const meta: Record<string, string> = {};
    match[1].split('\n').forEach((line) => {
      const idx = line.indexOf(':');
      if (idx > 0) {
        const key = line.slice(0, idx).trim();
        const val = line.slice(idx + 1).trim();
        meta[key] = val;
      }
    });
    return { meta, body: match[2] };
  } catch {
    return null;
  }
}

export function listFiles(dir: string, ext?: string): string[] {
  try {
    if (!fs.existsSync(dir)) return [];
    const files = fs.readdirSync(dir);
    if (ext) return files.filter((f) => f.endsWith(ext));
    return files;
  } catch {
    return [];
  }
}

export function getFileAge(filePath: string): number | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const stat = fs.statSync(filePath);
    return (Date.now() - stat.mtimeMs) / (1000 * 60 * 60);
  } catch {
    return null;
  }
}

export function readFileContent(filePath: string): string {
  try {
    if (!fs.existsSync(filePath)) return '';
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return '';
  }
}

export function getFileMtime(filePath: string): Date | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    return fs.statSync(filePath).mtime;
  } catch {
    return null;
  }
}

export function listDirs(dir: string): string[] {
  try {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).filter((f) => {
      try {
        return fs.statSync(path.join(dir, f)).isDirectory();
      } catch {
        return false;
      }
    });
  } catch {
    return [];
  }
}

export function walkFiles(dir: string, ext?: string): string[] {
  const results: string[] = [];
  try {
    if (!fs.existsSync(dir)) return results;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...walkFiles(fullPath, ext));
      } else if (!ext || entry.name.endsWith(ext)) {
        results.push(fullPath);
      }
    }
  } catch {
    // ignore
  }
  return results;
}
