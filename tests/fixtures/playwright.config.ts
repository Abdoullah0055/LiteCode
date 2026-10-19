import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  use: { baseURL: "http://127.0.0.1:4179", browserName: "chromium" },
  projects: [...[375, 390, 430].map((width) => ({ name: `mobile-${width}`, use: { viewport: { width, height: 844 }, isMobile: true, hasTouch: true } })), { name: "desktop", use: { viewport: { width: 1440, height: 1000 }, isMobile: false, hasTouch: false } }],
  webServer: { command: "npx vite --config vite.config.ts", url: "http://127.0.0.1:4179/mobile-harness.html", reuseExistingServer: false, timeout: 30000 },
});
