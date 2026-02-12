import { defineConfig } from 'tsup';
import { readFileSync, writeFileSync, mkdirSync, cpSync } from 'fs';
import { join } from 'path';

function prependUseClient(dir: string, entries: string[]) {
  for (const entry of entries) {
    for (const ext of ['.js', '.cjs']) {
      const filePath = join(dir, entry + ext);
      try {
        const content = readFileSync(filePath, 'utf-8');
        if (!content.startsWith('"use client"')) {
          writeFileSync(filePath, `"use client";\n${content}`);
        }
      } catch {}
    }
  }
}

export default defineConfig([
  {
    entry: {
      index: 'src/index.ts',
      'lib/index': 'src/lib/index.ts',
      'api/posts': 'src/api/posts.ts',
      'api/media': 'src/api/media.ts',
      'api/categories': 'src/api/categories.ts',
      'api/settings': 'src/api/settings.ts',
      'api/tokens': 'src/api/tokens.ts',
      'api/sitemap': 'src/api/sitemap.ts',
      'api/rss': 'src/api/rss.ts',
    },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    external: ['react', 'react-dom', 'next', 'sharp', 'mongodb'],
    splitting: true,
    treeshake: true,
  },
  {
    entry: {
      'components/index': 'src/components/index.ts',
      'admin/index': 'src/admin/index.ts',
      'editor/index': 'src/editor/index.ts',
    },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    external: ['react', 'react-dom', 'next', 'sharp', 'mongodb'],
    splitting: false,
    treeshake: true,
    esbuildOptions(options) {
      options.jsx = 'automatic';
    },
    onSuccess: async () => {
      prependUseClient('dist', [
        'components/index',
        'admin/index',
        'editor/index',
      ]);
      // Copy CSS files to dist
      cpSync('src/styles', 'dist/styles', { recursive: true });
    },
  },
  {
    entry: {
      'cli/index': 'src/cli/index.ts',
    },
    format: ['cjs'],
    dts: false,
    sourcemap: false,
    external: ['sharp', 'mongodb'],
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
]);
