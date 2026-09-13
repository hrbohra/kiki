import { defineConfig } from 'vitest/config';

// Integration tests hit the real database (DIRECT_URL from the root .env, injected via dotenv-cli
// in the `test` script). No decorator metadata is needed — services are wired by hand, not via Nest.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    globals: true,
    testTimeout: 30000,
    hookTimeout: 30000,
    fileParallelism: false,
  },
});
