import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  target: 'node18',
  outDir: 'dist',
  clean: true,
  dts: true,
  sourcemap: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
  // Externalise workspace deps so they resolve at runtime
  external: ['@onxza/core'],
  noExternal: ['commander', 'chalk', 'ora'],
});
