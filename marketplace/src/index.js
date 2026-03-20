/**
 * ONXZA Skills Marketplace API
 *
 * Serves: GET /skills, GET /skills/:name, POST /skills/publish
 * Deployed to: api.onxza.com
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 * Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
 */

'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const skillsRouter = require('./routes/skills');
const authRouter = require('./routes/auth');
const { errorHandler, notFound } = require('./middleware/errors');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Security ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['https://onxza.com', 'https://app.onxza.com'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Rate limiting ────────────────────────────────────────────────────────────
const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — please slow down.' },
});

const publishLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many publish attempts. Max 20 per hour.' },
});

// ─── Body parsing ─────────────────────────────────────────────────────────────
// Note: multipart/form-data for /publish is handled in the route via busboy.
// JSON body parsing for auth routes only.
app.use('/api/v1/auth', express.json({ limit: '16kb' }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'onxza-marketplace-api', version: '0.1.0' });
});

app.use('/api/v1/skills', readLimiter, skillsRouter);
app.use('/api/v1/auth', authRouter);

// Apply publish rate limiter to the publish endpoint specifically
// (Handled inside skills router — see routes/skills.js)
app.set('publishLimiter', publishLimiter);

// ─── Error handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[ONXZA Marketplace API] Listening on port ${PORT}`);
    console.log(`[ONXZA Marketplace API] Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

module.exports = app;
