import { defineConfig } from 'vitest/config';

// Domain tests only. The domain layer is pure TypeScript with no React Native imports,
// so it runs in plain Node without a native/metro toolchain — fast, deterministic CI.
export default defineConfig({
  test: {
    globals: true,
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
