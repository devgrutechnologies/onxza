'use strict';

/**
 * Secret Scanner — Credential and Token Detection
 *
 * Scans files for common secret patterns: API keys, tokens, passwords,
 * private keys, connection strings. Used by `onxza security scan` and
 * integrated into `onxza validate --all`.
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 * Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
 */

const fs = require('fs');
const path = require('path');

/**
 * Secret patterns to detect.
 * Each has: name, regex, severity (critical|high|medium|low), description.
 */
const SECRET_PATTERNS = [
  // API Keys
  {
    name: 'AWS Access Key',
    regex: /\bAKIA[0-9A-Z]{16}\b/g,
    severity: 'critical',
    description: 'AWS IAM access key ID',
  },
  {
    name: 'AWS Secret Key',
    regex: /(?<![A-Za-z0-9/+=])[A-Za-z0-9/+=]{40}(?![A-Za-z0-9/+=])/g,
    severity: 'high',
    description: 'Potential AWS secret access key (40-char base64)',
    requiresContext: true, // Only flag when near AWS-related terms
    contextPattern: /aws|amazon|s3|ec2|iam|secret.?key/i,
  },
  {
    name: 'OpenAI API Key',
    regex: /\bsk-[A-Za-z0-9]{20,}T3BlbkFJ[A-Za-z0-9]{20,}\b/g,
    severity: 'critical',
    description: 'OpenAI API key',
  },
  {
    name: 'OpenAI Project Key',
    regex: /\bsk-proj-[A-Za-z0-9_-]{40,}\b/g,
    severity: 'critical',
    description: 'OpenAI project API key',
  },
  {
    name: 'Anthropic API Key',
    regex: /\bsk-ant-[A-Za-z0-9_-]{40,}\b/g,
    severity: 'critical',
    description: 'Anthropic API key',
  },
  {
    name: 'Stripe Secret Key',
    regex: /\bsk_(live|test)_[A-Za-z0-9]{24,}\b/g,
    severity: 'critical',
    description: 'Stripe secret API key',
  },
  {
    name: 'Stripe Publishable Key',
    regex: /\bpk_(live|test)_[A-Za-z0-9]{24,}\b/g,
    severity: 'medium',
    description: 'Stripe publishable key (lower risk but should not be in source)',
  },
  {
    name: 'GitHub Token',
    regex: /\bgh[pousr]_[A-Za-z0-9_]{36,}\b/g,
    severity: 'critical',
    description: 'GitHub personal access token or OAuth token',
  },
  {
    name: 'GitHub Classic Token',
    regex: /\bghp_[A-Za-z0-9]{36}\b/g,
    severity: 'critical',
    description: 'GitHub classic personal access token',
  },
  {
    name: 'Slack Token',
    regex: /\bxox[bpsorta]-[A-Za-z0-9-]{10,}\b/g,
    severity: 'critical',
    description: 'Slack API token',
  },
  {
    name: 'Slack Webhook',
    regex: /https:\/\/hooks\.slack\.com\/services\/T[A-Z0-9]+\/B[A-Z0-9]+\/[A-Za-z0-9]+/g,
    severity: 'high',
    description: 'Slack webhook URL',
  },
  {
    name: 'Google API Key',
    regex: /\bAIza[0-9A-Za-z_-]{35}\b/g,
    severity: 'critical',
    description: 'Google API key',
  },
  {
    name: 'Twilio Account SID',
    regex: /\bAC[0-9a-f]{32}\b/g,
    severity: 'high',
    description: 'Twilio account SID',
  },
  {
    name: 'SendGrid API Key',
    regex: /\bSG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}\b/g,
    severity: 'critical',
    description: 'SendGrid API key',
  },
  {
    name: 'Mailgun API Key',
    regex: /\bkey-[A-Za-z0-9]{32}\b/g,
    severity: 'critical',
    description: 'Mailgun API key',
  },

  // Private Keys
  {
    name: 'RSA Private Key',
    regex: /-----BEGIN RSA PRIVATE KEY-----/g,
    severity: 'critical',
    description: 'RSA private key header detected',
  },
  {
    name: 'EC Private Key',
    regex: /-----BEGIN EC PRIVATE KEY-----/g,
    severity: 'critical',
    description: 'Elliptic curve private key header detected',
  },
  {
    name: 'Generic Private Key',
    regex: /-----BEGIN PRIVATE KEY-----/g,
    severity: 'critical',
    description: 'Private key header detected',
  },
  {
    name: 'PGP Private Key',
    regex: /-----BEGIN PGP PRIVATE KEY BLOCK-----/g,
    severity: 'critical',
    description: 'PGP private key block detected',
  },
  {
    name: 'SSH Private Key',
    regex: /-----BEGIN OPENSSH PRIVATE KEY-----/g,
    severity: 'critical',
    description: 'OpenSSH private key detected',
  },

  // Connection Strings & Passwords
  {
    name: 'Database Connection String',
    regex: /\b(mongodb(\+srv)?|postgres(ql)?|mysql|redis|amqp):\/\/[^\s'"]+:[^\s'"]+@[^\s'"]+/gi,
    severity: 'critical',
    description: 'Database connection string with embedded credentials',
  },
  {
    name: 'Password in Assignment',
    regex: /(?:password|passwd|pwd|secret|token|api_key|apikey|api-key|auth_token|access_token)\s*[:=]\s*['"][^'"]{8,}['"]/gi,
    severity: 'high',
    description: 'Password or secret assigned in code',
  },
  {
    name: 'Bearer Token',
    regex: /\bBearer\s+[A-Za-z0-9_-]{20,}\b/g,
    severity: 'high',
    description: 'Bearer authorization token',
  },
  {
    name: 'Basic Auth Header',
    regex: /\bBasic\s+[A-Za-z0-9+/=]{20,}\b/g,
    severity: 'high',
    description: 'Basic auth header (base64 encoded credentials)',
  },

  // JWT
  {
    name: 'JSON Web Token',
    regex: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
    severity: 'high',
    description: 'JSON Web Token (may contain sensitive claims)',
  },

  // Env file patterns
  {
    name: 'Env File Secret',
    regex: /^(?:PRIVATE_KEY|SECRET_KEY|DATABASE_URL|DB_PASSWORD|API_SECRET|JWT_SECRET|ENCRYPTION_KEY)\s*=\s*.+$/gm,
    severity: 'high',
    description: 'Sensitive environment variable definition',
  },

  // Generic high-entropy strings (conservative)
  {
    name: 'Hex Secret (32+ chars)',
    regex: /(?:secret|key|token|password|credential)['"]?\s*[:=]\s*['"]?[0-9a-f]{32,}['"]?/gi,
    severity: 'medium',
    description: 'Hex string assigned to a secret-like variable',
  },
];

/**
 * Files/directories to skip during scanning.
 */
const SKIP_DIRS = new Set([
  'node_modules', '.git', '.hg', '.svn', '__pycache__',
  '.pytest_cache', 'dist', 'build', '.next', '.nuxt',
  'vendor', 'venv', '.venv', 'env', '.env.local',
  'coverage', '.nyc_output', 'checkpoints',
]);

const SKIP_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico',
  '.mp3', '.mp4', '.wav', '.avi', '.mov',
  '.zip', '.tar', '.gz', '.bz2', '.7z',
  '.woff', '.woff2', '.ttf', '.eot',
  '.pyc', '.pyo', '.so', '.dylib', '.dll',
  '.exe', '.bin', '.o', '.a',
  '.lock', '.sum',
]);

const MAX_FILE_SIZE = 1024 * 1024; // 1MB — skip larger files

/**
 * Scan a single file for secrets.
 *
 * @param {string} filePath — Absolute or relative path
 * @returns {{ file: string, findings: Array<{ line: number, pattern: string, severity: string, match: string, description: string }> }}
 */
function scanFile(filePath) {
  const findings = [];

  try {
    const stat = fs.statSync(filePath);
    if (stat.size > MAX_FILE_SIZE) return { file: filePath, findings, skipped: 'too_large' };
    if (stat.size === 0) return { file: filePath, findings };
  } catch {
    return { file: filePath, findings, skipped: 'unreadable' };
  }

  const ext = path.extname(filePath).toLowerCase();
  if (SKIP_EXTENSIONS.has(ext)) return { file: filePath, findings, skipped: 'binary_extension' };

  let content;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch {
    return { file: filePath, findings, skipped: 'read_error' };
  }

  const lines = content.split('\n');

  for (const pattern of SECRET_PATTERNS) {
    // Reset regex lastIndex for global regexes
    pattern.regex.lastIndex = 0;

    // If pattern requires context, check file-level context first
    if (pattern.requiresContext && pattern.contextPattern) {
      if (!pattern.contextPattern.test(content)) continue;
    }

    let match;
    while ((match = pattern.regex.exec(content)) !== null) {
      // Find the line number
      const beforeMatch = content.substring(0, match.index);
      const lineNumber = beforeMatch.split('\n').length;

      // Redact the actual secret for safety
      const matchText = match[0];
      const redacted = matchText.length > 8
        ? matchText.substring(0, 4) + '****' + matchText.substring(matchText.length - 4)
        : '****';

      findings.push({
        line: lineNumber,
        pattern: pattern.name,
        severity: pattern.severity,
        match: redacted,
        description: pattern.description,
        lineContent: (lines[lineNumber - 1] || '').trim().substring(0, 120),
      });
    }
  }

  return { file: filePath, findings };
}

/**
 * Recursively scan a directory for secrets.
 *
 * @param {string} dirPath — Directory to scan
 * @param {object} [options]
 * @param {string[]} [options.exclude] — Additional directories to skip
 * @param {number} [options.maxFiles] — Maximum files to scan (default: 10000)
 * @returns {{ results: Array, totalFiles: number, filesWithFindings: number, totalFindings: number, criticalCount: number, highCount: number }}
 */
function scanDirectory(dirPath, options = {}) {
  const exclude = new Set([...SKIP_DIRS, ...(options.exclude || [])]);
  const maxFiles = options.maxFiles || 10000;
  const results = [];
  let totalFiles = 0;
  let filesWithFindings = 0;
  let totalFindings = 0;
  let criticalCount = 0;
  let highCount = 0;

  function walk(dir) {
    if (totalFiles >= maxFiles) return;

    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (totalFiles >= maxFiles) return;

      if (entry.isDirectory()) {
        if (exclude.has(entry.name) || entry.name.startsWith('.')) continue;
        walk(path.join(dir, entry.name));
      } else if (entry.isFile()) {
        totalFiles++;
        const filePath = path.join(dir, entry.name);
        const result = scanFile(filePath);

        if (result.findings.length > 0) {
          results.push(result);
          filesWithFindings++;
          totalFindings += result.findings.length;
          for (const f of result.findings) {
            if (f.severity === 'critical') criticalCount++;
            if (f.severity === 'high') highCount++;
          }
        }
      }
    }
  }

  walk(dirPath);

  return {
    results,
    totalFiles,
    filesWithFindings,
    totalFindings,
    criticalCount,
    highCount,
  };
}

/**
 * Format scan results for human-readable output.
 */
function formatResults(scanResult, options = {}) {
  const { results, totalFiles, filesWithFindings, totalFindings, criticalCount, highCount } = scanResult;
  const lines = [];

  lines.push('');
  lines.push('═══════════════════════════════════════');
  lines.push('  ONXZA Secret Scanner Results');
  lines.push('═══════════════════════════════════════');
  lines.push('');
  lines.push(`  Files scanned:    ${totalFiles}`);
  lines.push(`  Files with hits:  ${filesWithFindings}`);
  lines.push(`  Total findings:   ${totalFindings}`);
  lines.push(`  Critical:         ${criticalCount}`);
  lines.push(`  High:             ${highCount}`);
  lines.push('');

  if (totalFindings === 0) {
    lines.push('  ✓ No secrets detected. Clean scan.');
    lines.push('');
    return lines.join('\n');
  }

  // Sort by severity
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const sortedResults = [...results].sort((a, b) => {
    const aSev = Math.min(...a.findings.map(f => severityOrder[f.severity] || 99));
    const bSev = Math.min(...b.findings.map(f => severityOrder[f.severity] || 99));
    return aSev - bSev;
  });

  for (const result of sortedResults) {
    const relPath = options.basePath
      ? path.relative(options.basePath, result.file)
      : result.file;
    lines.push(`  ┌─ ${relPath}`);

    for (const finding of result.findings) {
      const icon = finding.severity === 'critical' ? '🔴' :
                   finding.severity === 'high' ? '🟠' :
                   finding.severity === 'medium' ? '🟡' : '⚪';
      lines.push(`  │  ${icon} Line ${finding.line}: ${finding.pattern} [${finding.severity.toUpperCase()}]`);
      lines.push(`  │     ${finding.description}`);
      lines.push(`  │     Match: ${finding.match}`);
    }
    lines.push('  └──');
    lines.push('');
  }

  if (criticalCount > 0) {
    lines.push('  ⚠️  CRITICAL secrets found. These MUST be rotated immediately.');
    lines.push('     Remove from source, rotate credentials, update .gitignore.');
  }

  lines.push('');
  return lines.join('\n');
}

module.exports = {
  scanFile,
  scanDirectory,
  formatResults,
  SECRET_PATTERNS,
  SKIP_DIRS,
  SKIP_EXTENSIONS,
};
