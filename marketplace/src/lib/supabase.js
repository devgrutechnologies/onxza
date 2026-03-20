/**
 * Supabase client — ONXZA Marketplace API
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 * Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
 */

'use strict';

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  if (process.env.NODE_ENV !== 'test') {
    console.warn(
      '[ONXZA Marketplace] WARNING: SUPABASE_URL or SUPABASE_SERVICE_KEY not set. ' +
      'Database operations will fail. Set these environment variables before starting.'
    );
  }
}

/**
 * Admin client — uses service role key, bypasses RLS.
 * Used for all server-side operations. Never exposed to the client.
 */
const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false },
    })
  : null;

module.exports = { supabase };
