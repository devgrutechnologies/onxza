/**
 * Skills routes — ONXZA Marketplace API
 *
 * GET  /api/v1/skills               — Paginated skill list
 * GET  /api/v1/skills/:name         — Single skill metadata + download URL
 * POST /api/v1/skills/publish       — Publish a skill (auth required)
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 * Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
 */

'use strict';

const express = require('express');
const Busboy = require('busboy');
const semver = require('semver');
const tar = require('tar');
const { Readable } = require('stream');
const { supabase } = require('../lib/supabase');
const { validateSkillArchive, extractSkillMetadata } = require('../lib/tori-qmd');
const { uploadSkillTarball } = require('../lib/storage');
const { requireAuth } = require('../lib/auth');

const router = express.Router();

// ─── GET /api/v1/skills ───────────────────────────────────────────────────────
// Returns paginated list of published skills.
//
// Query params:
//   page     (default: 1)
//   limit    (default: 20, max: 100)
//   q        (optional: search by name or description)
//   tag      (optional: filter by tag)
router.get('/', async (req, res, next) => {
  try {
    if (!supabase) return res.json({ skills: [], total: 0, page: 1, limit: 20 });

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;
    const q = (req.query.q || '').trim();
    const tag = (req.query.tag || '').trim();

    let query = supabase
      .from('skills')
      .select('name, version, description, author, tags, created_at, updated_at', { count: 'exact' })
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (q) {
      query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
    }
    if (tag) {
      query = query.contains('tags', [tag]);
    }

    const { data, count, error } = await query;
    if (error) throw Object.assign(new Error(error.message), { status: 500 });

    res.json({
      skills: data || [],
      total: count || 0,
      page,
      limit,
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/v1/skills/:name ─────────────────────────────────────────────────
// Returns full metadata for a skill including all published versions and latest download URL.
//
// Query params:
//   version  (optional: get a specific version, default: latest)
router.get('/:name', async (req, res, next) => {
  try {
    if (!supabase) {
      return res.status(503).json({ error: 'Service unavailable', message: 'Database not configured.' });
    }

    const { name } = req.params;
    const requestedVersion = req.query.version || null;

    // Validate skill name format (lowercase alphanumeric + hyphens)
    if (!/^[a-z0-9-]+$/.test(name)) {
      return res.status(400).json({ error: 'Invalid skill name', message: 'Skill names must be lowercase alphanumeric with hyphens only.' });
    }

    // Fetch the specific version or latest
    let versionQuery = supabase
      .from('skill_versions')
      .select('*')
      .eq('skill_name', name)
      .order('published_at', { ascending: false });

    if (requestedVersion) {
      versionQuery = versionQuery.eq('version', requestedVersion).single();
    } else {
      versionQuery = versionQuery.limit(1).single();
    }

    const { data: versionData, error: versionError } = await versionQuery;

    if (versionError || !versionData) {
      const notFoundMsg = requestedVersion
        ? `Skill "${name}" version "${requestedVersion}" not found.`
        : `Skill "${name}" not found.`;
      return res.status(404).json({ error: 'Not Found', message: notFoundMsg });
    }

    // Fetch all published versions (for the versions list)
    const { data: allVersions } = await supabase
      .from('skill_versions')
      .select('version, published_at, publisher_username')
      .eq('skill_name', name)
      .order('published_at', { ascending: false });

    // Fetch the base skill record
    const { data: skillRecord } = await supabase
      .from('skills')
      .select('*')
      .eq('name', name)
      .single();

    res.json({
      name,
      description: skillRecord?.description || versionData.description,
      author: skillRecord?.author || versionData.publisher_username,
      tags: skillRecord?.tags || [],
      latest_version: skillRecord?.version,
      requested_version: versionData.version,
      download_url: versionData.download_url,
      metadata: versionData.metadata || {},
      versions: allVersions || [],
      published_at: versionData.published_at,
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/v1/skills/publish ─────────────────────────────────────────────
// Upload a skill tarball for publication.
// Requires: Authorization: Bearer <token>
// Body: multipart/form-data with field "tarball" (the .tar.gz file)
//
// Validation steps:
//   1. Auth required
//   2. File must be .tar.gz
//   3. Unpack and validate with TORI-QMD
//   4. Check skill name + version don't already exist
//   5. Upload to Supabase Storage
//   6. Insert/update skill record in DB
router.post('/publish', requireAuth, (req, res, next) => {
  const publishLimiter = req.app.get('publishLimiter');
  if (publishLimiter) {
    // Apply publish-specific rate limiting
    publishLimiter(req, res, () => handlePublish(req, res, next));
  } else {
    handlePublish(req, res, next);
  }
});

async function handlePublish(req, res, next) {
  const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

  try {
    // Parse multipart upload
    const { tarball, filename } = await parseUpload(req, MAX_SIZE_BYTES);

    if (!filename.endsWith('.tar.gz') && !filename.endsWith('.tgz')) {
      return res.status(400).json({
        error: 'Invalid file type',
        message: 'Skill archives must be .tar.gz files.',
      });
    }

    // Extract and read files from tarball
    let files;
    try {
      files = await extractTarball(tarball);
    } catch (err) {
      return res.status(400).json({
        error: 'Invalid archive',
        message: `Could not extract tarball: ${err.message}`,
      });
    }

    // TORI-QMD validation
    const validation = validateSkillArchive(files);
    if (!validation.valid) {
      return res.status(422).json({
        error: 'TORI-QMD validation failed',
        message: 'Skill did not pass quality validation.',
        errors: validation.errors,
      });
    }

    // Extract metadata from SKILL.md
    const skillMdKey = Object.keys(files).find(
      (f) => f === 'SKILL.md' || f.endsWith('/SKILL.md')
    );
    const metadata = extractSkillMetadata(files[skillMdKey]);
    const skillName = metadata['name'] || filename.replace(/\.tar\.gz$|\.tgz$/, '').replace(/-\d+\.\d+\.\d+.*$/, '');
    const version = metadata['version'];

    // Validate skill name
    if (!/^[a-z0-9-]+$/.test(skillName)) {
      return res.status(400).json({
        error: 'Invalid skill name',
        message: 'Skill name in SKILL.md must be lowercase alphanumeric with hyphens only.',
      });
    }

    // Check for duplicate version
    if (supabase) {
      const { data: existing } = await supabase
        .from('skill_versions')
        .select('id')
        .eq('skill_name', skillName)
        .eq('version', version)
        .single();

      if (existing) {
        return res.status(409).json({
          error: 'Version exists',
          message: `${skillName}@${version} is already published. Bump the version to publish an update.`,
        });
      }
    }

    // Upload tarball
    let downloadUrl = '';
    if (supabase) {
      const uploaded = await uploadSkillTarball(skillName, version, tarball);
      downloadUrl = uploaded.downloadUrl;
    }

    // Persist to database
    if (supabase) {
      const description = metadata['description'] || metadata['summary'] || '';
      const author = metadata['owner'] || req.user.username;
      const tags = (metadata['tags'] || '').split(',').map((t) => t.trim()).filter(Boolean);

      // Upsert the base skill record (update version + metadata if newer)
      const { error: skillError } = await supabase
        .from('skills')
        .upsert({
          name: skillName,
          description,
          author,
          tags,
          version,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'name', ignoreDuplicates: false });

      if (skillError) throw new Error(`DB error (skills): ${skillError.message}`);

      // Insert version record
      const { error: versionError } = await supabase
        .from('skill_versions')
        .insert({
          skill_name: skillName,
          version,
          download_url: downloadUrl,
          publisher_id: req.user.id,
          publisher_username: req.user.username,
          metadata,
          description,
          published_at: new Date().toISOString(),
        });

      if (versionError) throw new Error(`DB error (skill_versions): ${versionError.message}`);
    }

    res.status(201).json({
      message: `${skillName}@${version} published successfully.`,
      name: skillName,
      version,
      download_url: downloadUrl,
    });
  } catch (err) {
    if (err.code === 'VERSION_EXISTS') {
      return res.status(409).json({ error: 'Version exists', message: err.message });
    }
    next(err);
  }
}

/**
 * Parse a multipart/form-data upload with a single "tarball" field.
 *
 * @param {import('express').Request} req
 * @param {number} maxSize
 * @returns {Promise<{ tarball: Buffer, filename: string }>}
 */
function parseUpload(req, maxSize) {
  return new Promise((resolve, reject) => {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
      return reject(Object.assign(new Error('Request must be multipart/form-data with a "tarball" field.'), { status: 400, expose: true }));
    }

    const bb = Busboy({ headers: req.headers, limits: { fileSize: maxSize, files: 1, fields: 5 } });
    let resolved = false;

    bb.on('file', (fieldname, fileStream, info) => {
      if (fieldname !== 'tarball') {
        fileStream.resume();
        return;
      }

      const chunks = [];
      let size = 0;

      fileStream.on('data', (chunk) => {
        size += chunk.length;
        if (size > maxSize) {
          fileStream.resume();
          if (!resolved) {
            resolved = true;
            reject(Object.assign(new Error('Skill archive exceeds the 10 MB size limit.'), { status: 413, expose: true }));
          }
          return;
        }
        chunks.push(chunk);
      });

      fileStream.on('end', () => {
        if (!resolved) {
          resolved = true;
          resolve({ tarball: Buffer.concat(chunks), filename: info.filename || 'skill.tar.gz' });
        }
      });

      fileStream.on('error', (err) => {
        if (!resolved) { resolved = true; reject(err); }
      });
    });

    bb.on('error', (err) => {
      if (!resolved) { resolved = true; reject(err); }
    });

    bb.on('finish', () => {
      if (!resolved) {
        resolved = true;
        reject(Object.assign(new Error('No "tarball" field found in upload.'), { status: 400, expose: true }));
      }
    });

    req.pipe(bb);
  });
}

/**
 * Extract a tarball Buffer into a filename → content map.
 * Only extracts text-readable files (markdown, js, json, txt, yaml, sh).
 *
 * @param {Buffer} tarball
 * @returns {Promise<Record<string, string>>}
 */
async function extractTarball(tarball) {
  const files = {};
  const textExtensions = /\.(md|js|json|txt|yaml|yml|sh|py|ts|toml)$/i;

  const stream = Readable.from(tarball);

  await new Promise((resolve, reject) => {
    stream.pipe(
      tar.t({
        onentry(entry) {
          if (entry.type !== 'File') return;

          const name = entry.path;
          if (!textExtensions.test(name)) {
            entry.resume();
            return;
          }

          const chunks = [];
          entry.on('data', (chunk) => chunks.push(chunk));
          entry.on('end', () => {
            try {
              files[name] = Buffer.concat(chunks).toString('utf-8');
            } catch {
              // Binary or non-utf8 — skip text scan but note presence
              files[name] = '';
            }
          });
          entry.on('error', reject);
        },
      })
        .on('finish', resolve)
        .on('error', reject)
    );
  });

  return files;
}

module.exports = router;
