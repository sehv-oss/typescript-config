import { defineConfig } from 'cspell';

export default defineConfig({
  import: ['@sehv-oss/cspell-config'],
  ignorePaths: ['pnpm-lock.yaml', 'CHANGELOG.md'],
  words: ['sehv'],
});
