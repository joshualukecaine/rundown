import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    env: { TZ: 'UTC' },
    include: ['src/**/*.test.ts', 'cli/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/lib/date-utils.ts',
        'src/lib/training-utils.ts',
        'src/lib/intervals/client.ts',
        'src/lib/intervals/errors.ts',
        'src/lib/auth/oauth.ts',
        'src/middleware.ts',
      ],
      exclude: [],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
