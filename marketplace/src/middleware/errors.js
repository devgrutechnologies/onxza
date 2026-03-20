/**
 * Error handling middleware — ONXZA Marketplace API
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 * Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
 */

'use strict';

function notFound(req, res) {
  res.status(404).json({
    error: 'Not Found',
    message: `${req.method} ${req.path} is not a valid API endpoint.`,
  });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const message = err.expose ? err.message : (status < 500 ? err.message : 'Internal server error');

  if (status >= 500) {
    console.error('[ONXZA Marketplace] Unhandled error:', err);
  }

  res.status(status).json({ error: err.name || 'Error', message });
}

module.exports = { notFound, errorHandler };
