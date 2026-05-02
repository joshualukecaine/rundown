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
        'src/lib/zone-pace.ts',
        'src/lib/intervals/client.ts',
        'src/lib/intervals/errors.ts',
        'src/lib/auth/oauth.ts',
        'src/middleware.ts',
        'src/app/api/zone-pace/route.ts',
        'src/app/api/events/route.ts',
        'src/app/api/events/[id]/route.ts',
        'src/app/api/events/bulk/route.ts',
        'src/app/api/athlete/route.ts',
        'src/hooks/use-estimated-distance.ts',
        'src/lib/wellness-utils.ts',
        'src/app/api/wellness/route.ts',
      ],
      exclude: [],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
