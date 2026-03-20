/**
 * Auth middleware — ONXZA Marketplace API
 *
 * publish: requires valid JWT (issued by /api/v1/auth/token)
 * install/list: public — no auth required
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 * Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
 */

'use strict';

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'onxza-dev-secret-change-in-production';

if (process.env.NODE_ENV === 'production' && JWT_SECRET === 'onxza-dev-secret-change-in-production') {
  console.error('[ONXZA Marketplace] FATAL: JWT_SECRET must be set in production.');
  process.exit(1);
}

/**
 * requireAuth — Express middleware that validates a Bearer JWT.
 * Sets req.user = { id, username, email } on success.
 */
function requireAuth(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Publishing requires authentication. Get a token from POST /api/v1/auth/token.',
    });
  }

  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.sub,
      username: decoded.username,
      email: decoded.email,
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', message: 'Please re-authenticate.' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * issueToken — signs a JWT for a given user.
 * Used by auth routes after credential verification.
 *
 * @param {{ id: string, username: string, email: string }} user
 * @returns {string}
 */
function issueToken(user) {
  return jwt.sign(
    { username: user.username, email: user.email },
    JWT_SECRET,
    { subject: user.id, expiresIn: '30d' }
  );
}

module.exports = { requireAuth, issueToken };
