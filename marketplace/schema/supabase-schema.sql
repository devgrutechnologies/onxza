-- ONXZA Skills Marketplace — Supabase Database Schema
--
-- Run this in the Supabase SQL Editor to set up the marketplace database.
-- Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
-- Powered by DevGru US Inc. DBA DevGru Technology Products.
-- Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.

-- ─── Extensions ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Publisher Accounts ───────────────────────────────────────────────────────
-- Accounts that can publish skills to the marketplace.
-- Passwords are hashed with scrypt in the API layer before storage.
CREATE TABLE IF NOT EXISTS publisher_accounts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      TEXT NOT NULL UNIQUE,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Skills (latest version record) ─────────────────────────────────────────
-- One row per skill name. Tracks the latest published version.
-- Full version history is in skill_versions.
CREATE TABLE IF NOT EXISTS skills (
  name        TEXT PRIMARY KEY,
  description TEXT NOT NULL DEFAULT '',
  author      TEXT NOT NULL DEFAULT '',
  tags        TEXT[] NOT NULL DEFAULT '{}',
  version     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Full-text search index on name + description
CREATE INDEX IF NOT EXISTS idx_skills_fts ON skills USING GIN(
  to_tsvector('english', name || ' ' || description)
);

-- Tag array index for tag filtering
CREATE INDEX IF NOT EXISTS idx_skills_tags ON skills USING GIN(tags);

-- ─── Skill Versions ───────────────────────────────────────────────────────────
-- Full version history for each skill.
CREATE TABLE IF NOT EXISTS skill_versions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_name         TEXT NOT NULL REFERENCES skills(name) ON DELETE CASCADE,
  version            TEXT NOT NULL,
  description        TEXT NOT NULL DEFAULT '',
  download_url       TEXT NOT NULL DEFAULT '',
  publisher_id       UUID REFERENCES publisher_accounts(id),
  publisher_username TEXT NOT NULL,
  metadata           JSONB NOT NULL DEFAULT '{}',
  published_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(skill_name, version)
);

CREATE INDEX IF NOT EXISTS idx_skill_versions_skill_name ON skill_versions(skill_name);
CREATE INDEX IF NOT EXISTS idx_skill_versions_published_at ON skill_versions(published_at DESC);

-- ─── Row Level Security ───────────────────────────────────────────────────────
-- The API uses the service role key (bypasses RLS), but we set RLS policies
-- here for completeness and future client-side access if needed.

ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE publisher_accounts ENABLE ROW LEVEL SECURITY;

-- Skills and versions are publicly readable
CREATE POLICY skills_public_read ON skills FOR SELECT USING (true);
CREATE POLICY skill_versions_public_read ON skill_versions FOR SELECT USING (true);

-- Only the service role can write (enforced via API auth middleware)
CREATE POLICY skills_service_write ON skills FOR ALL USING (false);
CREATE POLICY skill_versions_service_write ON skill_versions FOR ALL USING (false);
CREATE POLICY publisher_accounts_no_direct ON publisher_accounts FOR ALL USING (false);

-- ─── Storage Bucket ───────────────────────────────────────────────────────────
-- Create via Supabase Dashboard → Storage → New Bucket
-- Name: skills
-- Public: true (download URLs are public — no auth required to download)
-- File size limit: 10 MB
--
-- SQL equivalent (run if using Supabase storage API):
-- INSERT INTO storage.buckets (id, name, public, file_size_limit)
-- VALUES ('skills', 'skills', true, 10485760)
-- ON CONFLICT (id) DO NOTHING;
