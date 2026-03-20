/**
 * @onxza/core — Shared TypeScript Types
 *
 * Single source of truth for all data shapes used across the ONXZA system.
 * CLI and server both import from here. No type duplication.
 *
 * Derived from: ARCHITECTURE-v0.1.md §6 (Complete Data Model)
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */

// ---------------------------------------------------------------------------
// openclaw.json types (§6.1)
// ---------------------------------------------------------------------------

export type PersistenceClass = 'persistent' | 'temporary';

export interface ModelRef {
  primary:   string;   // "provider/model-name", e.g. "anthropic/claude-sonnet-4-6"
  fallback?: string;
}

export interface AgentEntry {
  id:           string;             // kebab-case, unique, 1-64 chars
  workspace:    string;             // absolute path
  model?:       ModelRef;
  default?:     boolean;            // true for primary agent (main)
  company?:     string;             // company slug
  persistence?: PersistenceClass;
  heartbeat?: {
    enabled:          boolean;
    intervalMinutes?: number;
    cron?:            string;
  };
  memorySearch?: {
    extraPaths?: string[];
  };
  disabled?: boolean;
  tags?:     string[];
}

export interface CompanyEntry {
  slug:                 string;    // PascalCase, unique, 1-32 chars
  name:                 string;    // full display name
  parent?:              string;    // parent company slug
  visionPath?:          string;    // relative path to vision.md
  sharedLearningsPath?: string;    // relative path to shared-learnings/<slug>
  created?:             string;    // ISO 8601
  disabled?:            boolean;
}

export interface DispatcherConfig {
  enabled:             boolean;
  scanIntervalMinutes: number;
  ticketBasePath:      string;
  routing: {
    strategy: 'registry' | 'round-robin';
  };
}

export interface OpenclawConfig {
  $schemaVersion: string;                // semver, e.g. "1.0.0"
  meta: {
    lastTouchedVersion:  string;
    lastTouchedAt:       string;         // ISO 8601
    activeCompany?:      string;         // company slug set by `onxza company switch`
    initializedBy?:      string;
  };
  wizard?: Record<string, unknown>;
  auth?:   Record<string, unknown>;
  agents: {
    defaults: {
      model:      ModelRef;
      workspace?: string;
      memorySearch?: { extraPaths?: string[] };
    };
    list: AgentEntry[];
  };
  companies?: {
    list: CompanyEntry[];
  };
  dispatcher?:       DispatcherConfig;
  tools?:            Record<string, unknown>;
  broadcast?:        Record<string, unknown>;
  commands?:         Record<string, unknown>;
  session?:          Record<string, unknown>;
  hooks?:            Record<string, unknown>;
  channels?:         Record<string, unknown>;
  gateway?:          Record<string, unknown>;
  skills?:           Record<string, unknown>;
  plugins?:          Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Ticket types (§6.3)
// ---------------------------------------------------------------------------

export type TicketStatus =
  | 'open' | 'in-progress' | 'pending-approval' | 'blocked' | 'closed';

export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

export type TicketType =
  | 'task' | 'approval_request' | 'escalation'
  | 'agent_creation_request' | 'credentials_needed' | 'security_flag';

export interface TicketMeta {
  id:             string;    // TICKET-YYYYMMDD-COMPANY-NNN
  type:           TicketType;
  created_by:     string;    // agent-id
  created_at:     string;    // ISO 8601
  assigned_to:    string;    // agent-id
  project?:       string;
  company?:       string;    // company slug
  priority:       TicketPriority;
  status:         TicketStatus;
  requires_aaron: boolean;
  parent_ticket?: string;
  related_vision?: string;
}

export interface Ticket extends TicketMeta {
  filePath: string;    // absolute path
  body:     string;    // markdown body after frontmatter
}

// ---------------------------------------------------------------------------
// Checkpoint types (§6.5)
// ---------------------------------------------------------------------------

export interface CheckpointManifest {
  version:       string;    // "1.0.0"
  timestamp:     string;    // ISO 8601
  trigger:       string;    // "onxza init" | "onxza agent create <id>" | "manual" | ...
  agentId:       string;    // who triggered the checkpoint
  onxzaVersion:  string;    // CLI version that created it
  description?:  string;
}

export interface Checkpoint {
  id:         string;    // YYYYMMDD-HHMMSS-slug
  path:       string;    // absolute directory path
  manifest:   CheckpointManifest;
}

// ---------------------------------------------------------------------------
// Agent workspace types (§6.2)
// ---------------------------------------------------------------------------

export type AgentFileName =
  | 'AGENTS.md' | 'SOUL.md' | 'IDENTITY.md' | 'MEMORY.md' | 'TOOLS.md' | 'HEARTBEAT.md';

export const AGENT_FILES: AgentFileName[] = [
  'AGENTS.md', 'SOUL.md', 'IDENTITY.md', 'MEMORY.md', 'TOOLS.md', 'HEARTBEAT.md',
];

export interface AgentTemplateVars {
  AGENT_NAME:         string;    // DTP_ONXZA_Architect
  AGENT_ID:           string;    // dtp-onxza-architect
  COMPANY_SLUG:       string;    // DTP
  COMPANY_FULL_NAME:  string;    // DevGru Technology Products
  DEPARTMENT:         string;    // ONXZA
  ROLE:               string;    // Architect
  MODEL:              string;    // anthropic/claude-opus-4-6
  MODEL_SHORT:        string;    // claude-opus-4-6
  PERSISTENCE_CLASS:  string;    // persistent
  REPORTS_TO:         string;    // DTP_CEO
  CREATED_DATE:       string;    // 2026-03-18
  SL_READ_PATHS:      string;    // shared-learnings/global/, shared-learnings/DTP/
  SL_WRITE_PATH:      string;    // shared-learnings/DTP/
}

// ---------------------------------------------------------------------------
// TORI-QMD types
// ---------------------------------------------------------------------------

export interface ToriValidationError {
  field:   string;
  message: string;
  fix?:    string;
}

export interface ToriValidationResult {
  pass:     boolean;
  filePath: string;
  fileType: string;
  errors:   ToriValidationError[];
}

// ---------------------------------------------------------------------------
// Skill types (§9)
// ---------------------------------------------------------------------------

export interface SkillEntry {
  name:         string;
  version:      string;
  description:  string;
  skillMdPath:  string;    // absolute path to SKILL.md
  installedAt?: string;    // ISO 8601
}

// ---------------------------------------------------------------------------
// Status types (§7.2)
// ---------------------------------------------------------------------------

export interface OnxzaStatus {
  version:       string;
  schemaVersion: string;
  location:      string;
  initialized:   boolean;
  companies:     number;
  agents: {
    total:      number;
    persistent: number;
    temporary:  number;
  };
  tickets: {
    open:       number;
    inProgress: number;
    blocked:    number;
    closed:     number;
  };
  checkpoints:   number;
  lastActivity?: string;   // ISO 8601
}
