/**
 * @onxza/core — Schema loader and Ajv validator
 * Loads openclaw.schema.json and provides validate/compile helpers.
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 * Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { OpenclawConfig } from '../types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Resolve schema path — works from both src/ and dist/
function findSchemaPath(): string {
  // When running from dist/schema/index.js, schema is at ../../schemas/
  // When running from src/schema/index.ts via ts-node, same relative position
  const candidates = [
    join(__dirname, '../../schemas/openclaw.schema.json'),
    join(__dirname, '../../../schemas/openclaw.schema.json'),
  ];
  for (const c of candidates) {
    try {
      readFileSync(c);
      return c;
    } catch { /* next */ }
  }
  throw new Error('openclaw.schema.json not found. Expected at packages/core/schemas/');
}

let _ajv: Ajv | null = null;
let _schema: object | null = null;

function getAjv(): Ajv {
  if (!_ajv) {
    _ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(_ajv as Parameters<typeof addFormats>[0]);
  }
  return _ajv;
}

function getSchema(): object {
  if (!_schema) {
    const path = findSchemaPath();
    _schema = JSON.parse(readFileSync(path, 'utf-8')) as object;
  }
  return _schema;
}

export interface SchemaValidationError {
  path: string;
  message: string;
}

export interface SchemaValidationResult {
  valid: boolean;
  errors: SchemaValidationError[];
}

/**
 * Validate an object against the openclaw.json schema.
 */
export function validateSchema(data: unknown): SchemaValidationResult {
  const ajv = getAjv();
  const schema = getSchema();
  const validate = ajv.compile(schema);
  const valid = validate(data) as boolean;

  if (valid) {
    return { valid: true, errors: [] };
  }

  const errors: SchemaValidationError[] = (validate.errors ?? []).map((e) => ({
    path: e.instancePath || '(root)',
    message: e.message ?? 'Unknown validation error',
  }));

  return { valid: false, errors };
}

/**
 * Assert data is a valid OpenclawConfig. Throws on invalid.
 */
export function assertValidConfig(data: unknown): asserts data is OpenclawConfig {
  const result = validateSchema(data);
  if (!result.valid) {
    const msg = result.errors
      .map((e) => `  ${e.path}: ${e.message}`)
      .join('\n');
    throw new Error(`Invalid openclaw.json:\n${msg}`);
  }
}

export { getSchema };
