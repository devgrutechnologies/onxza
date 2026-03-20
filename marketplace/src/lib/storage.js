/**
 * Storage — ONXZA Marketplace API
 *
 * Wraps Supabase Storage for skill tarball uploads.
 * Skills are stored in the "skills" bucket:
 *   skills/{skill-name}/{version}/{skill-name}-{version}.tar.gz
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 * Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
 */

'use strict';

const { supabase } = require('./supabase');

const SKILLS_BUCKET = 'skills';

/**
 * Upload a skill tarball to Supabase Storage.
 *
 * @param {string} skillName - e.g. "weather"
 * @param {string} version   - semver e.g. "1.2.0"
 * @param {Buffer} tarball   - raw tarball bytes
 * @returns {Promise<{ path: string, downloadUrl: string }>}
 */
async function uploadSkillTarball(skillName, version, tarball) {
  if (!supabase) throw new Error('Supabase client not configured');

  const storagePath = `${skillName}/${version}/${skillName}-${version}.tar.gz`;

  const { error } = await supabase.storage
    .from(SKILLS_BUCKET)
    .upload(storagePath, tarball, {
      contentType: 'application/gzip',
      upsert: false, // Reject duplicate version uploads
    });

  if (error) {
    if (error.message?.includes('duplicate') || error.statusCode === 409) {
      throw Object.assign(new Error(`Version ${version} of ${skillName} already exists.`), { code: 'VERSION_EXISTS' });
    }
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(SKILLS_BUCKET)
    .getPublicUrl(storagePath);

  return {
    path: storagePath,
    downloadUrl: urlData.publicUrl,
  };
}

/**
 * Get a public download URL for a specific skill version.
 *
 * @param {string} skillName
 * @param {string} version
 * @returns {string}
 */
function getDownloadUrl(skillName, version) {
  if (!supabase) throw new Error('Supabase client not configured');
  const storagePath = `${skillName}/${version}/${skillName}-${version}.tar.gz`;
  const { data } = supabase.storage.from(SKILLS_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

module.exports = { uploadSkillTarball, getDownloadUrl };
