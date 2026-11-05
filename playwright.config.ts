import { defineConfig, devices } from '@playwright/test';

/**
 * Tests de bout en bout sur le build de production (lancer « npm run build » avant).
 * Les deux fenêtres d'un même contexte partagent leurs BroadcastChannel : de quoi tester la loupe.
 */
export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4300',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: 'node scripts/serve-dist.mjs 4300',
    url: 'http://localhost:4300',
    reuseExistingServer: !process.env['CI'],
  },
});
