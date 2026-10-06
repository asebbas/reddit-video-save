import { build } from 'esbuild';
import { cpSync, mkdirSync, rmSync } from 'node:fs';

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist', { recursive: true });
await build({
  entryPoints: { background: 'src/background.ts', content: 'src/content.ts' },
  outdir: 'dist', bundle: true, format: 'iife', target: 'firefox140',
  minify: false, sourcemap: false, legalComments: 'inline',
});
cpSync('manifest.json', 'dist/manifest.json');
cpSync('icons', 'dist/icons', { recursive: true });
