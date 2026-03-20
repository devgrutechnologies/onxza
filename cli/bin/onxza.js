#!/usr/bin/env node

/**
 * onxza — ONXZA CLI entry point
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 * Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
 */

'use strict';

const { createProgram } = require('../src/program');

const program = createProgram();
program.parse(process.argv);
