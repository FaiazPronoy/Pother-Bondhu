import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globalSetup: './tests/globalSetup.js',
    testTimeout: 20000,
    hookTimeout: 60000,
    fileParallelism: false,
  },
});
