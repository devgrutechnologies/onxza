#!/usr/bin/env node
// ONXZA CLI entry point
// Delegates to compiled dist/index.js

'use strict';

const { createRequire } = require('module');
const path = require('path');

// Support running directly from source (tsx) or from dist (built)
const distIndex = path.join(__dirname, '..', 'dist', 'index.js');
const srcIndex  = path.join(__dirname, '..', 'src', 'index.ts');

const fs = require('fs');
if (fs.existsSync(distIndex)) {
  require(distIndex);
} else {
  // Development: use tsx to run TypeScript directly
  require('tsx/cjs');
  require(srcIndex);
}
