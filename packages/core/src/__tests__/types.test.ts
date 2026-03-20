/**
 * @onxza/core — Type constants tests
 */
import { describe, it, expect } from 'vitest';
import {
  CREDIT_LINE,
  SCHEMA_VERSION,
  ONXZA_VERSION,
  ALWAYS_PRIVATE_FILES,
  ALWAYS_PUBLIC_FILES,
  AGENT_6_FILES,
  TICKET_STATUSES,
  TICKET_PRIORITIES,
} from '../types.js';

describe('constants', () => {
  it('CREDIT_LINE includes required attribution', () => {
    expect(CREDIT_LINE).toContain('Imagined by Aaron Gear');
    expect(CREDIT_LINE).toContain('Marcus Gear');
    expect(CREDIT_LINE).toContain('DevGru Technology Products');
  });

  it('SCHEMA_VERSION is semver', () => {
    expect(SCHEMA_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('ONXZA_VERSION is 0.1.0', () => {
    expect(ONXZA_VERSION).toBe('0.1.0');
  });

  it('ALWAYS_PRIVATE_FILES contains the 3 private files', () => {
    expect(ALWAYS_PRIVATE_FILES.has('MEMORY.md')).toBe(true);
    expect(ALWAYS_PRIVATE_FILES.has('SOUL.md')).toBe(true);
    expect(ALWAYS_PRIVATE_FILES.has('IDENTITY.md')).toBe(true);
    expect(ALWAYS_PRIVATE_FILES.size).toBe(3);
  });

  it('AGENT_6_FILES contains exactly 6 files', () => {
    expect(AGENT_6_FILES).toHaveLength(6);
    expect(AGENT_6_FILES).toContain('AGENTS.md');
    expect(AGENT_6_FILES).toContain('MEMORY.md');
  });

  it('TICKET_STATUSES includes all 5 statuses', () => {
    expect(TICKET_STATUSES).toContain('open');
    expect(TICKET_STATUSES).toContain('in-progress');
    expect(TICKET_STATUSES).toContain('pending-approval');
    expect(TICKET_STATUSES).toContain('blocked');
    expect(TICKET_STATUSES).toContain('closed');
    expect(TICKET_STATUSES).toHaveLength(5);
  });
});
