/**
 * Auth routes — ONXZA Marketplace API
 *
 * POST /api/v1/auth/register  — Create a new publisher account
 * POST /api/v1/auth/token     — Get a JWT for an existing account
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 * Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
 */

'use strict';

const express = require('express');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { supabase } = require('../lib/supabase');
const { issueToken } = require('../lib/auth');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many auth attempts. Please wait 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(authLimiter);

/**
 * POST /api/v1/auth/register
 * Body: { username, email, password }
 * Creates a publisher account. Password is hashed with scrypt.
 */
router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password } = req.body || {};

    if (!username || !email || !password) {
      return res.status(400).json({
        error: 'Missing fields',
        message: 'username, email, and password are required.',
      });
    }

    if (!/^[a-z0-9_-]{3,32}$/.test(username)) {
      return res.status(400).json({
        error: 'Invalid username',
        message: 'Username must be 3–32 characters: lowercase letters, numbers, hyphens, underscores.',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: 'Weak password',
        message: 'Password must be at least 8 characters.',
      });
    }

    const passwordHash = await hashPassword(password);

    if (!supabase) {
      // Dev mode — return a fake token
      const fakeUser = { id: 'dev-user-id', username, email };
      return res.status(201).json({ token: issueToken(fakeUser), username });
    }

    const { data, error } = await supabase
      .from('publisher_accounts')
      .insert({ username, email, password_hash: passwordHash })
      .select('id, username, email')
      .single();

    if (error) {
      if (error.code === '23505') { // Unique violation
        return res.status(409).json({
          error: 'Account exists',
          message: 'An account with that username or email already exists.',
        });
      }
      throw new Error(`DB error: ${error.message}`);
    }

    const token = issueToken(data);
    res.status(201).json({ token, username: data.username });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/auth/token
 * Body: { username, password }
 * Returns a JWT for a valid account.
 */
router.post('/token', async (req, res, next) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({
        error: 'Missing fields',
        message: 'username and password are required.',
      });
    }

    if (!supabase) {
      const fakeUser = { id: 'dev-user-id', username, email: `${username}@example.com` };
      return res.json({ token: issueToken(fakeUser) });
    }

    const { data: account, error } = await supabase
      .from('publisher_accounts')
      .select('id, username, email, password_hash')
      .eq('username', username)
      .single();

    if (error || !account) {
      // Constant-time rejection to prevent username enumeration
      await dummyVerify();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await verifyPassword(password, account.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = issueToken({ id: account.id, username: account.username, email: account.email });
    res.json({ token, username: account.username });
  } catch (err) {
    next(err);
  }
});

// ─── Password hashing (scrypt) ────────────────────────────────────────────────

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = await scryptAsync(password, salt, 64);
  return `${salt}:${derived.toString('hex')}`;
}

async function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const derived = await scryptAsync(password, salt, 64);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), derived);
}

/** Constant-time dummy operation to prevent timing attacks on missing accounts */
async function dummyVerify() {
  const salt = 'dummysalt00000000';
  await scryptAsync('dummypassword', salt, 64);
}

function scryptAsync(password, salt, keylen) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, keylen, (err, derived) => {
      if (err) reject(err);
      else resolve(derived);
    });
  });
}

module.exports = router;
