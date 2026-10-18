import { defineConfig } from '@playwright/test';
export default defineConfig({testDir: './tests/e2e', fullyParallel: false,
  use: {baseURL:'http://127.0.0.1:3000', browserName:'chromium'},
  projects: [375,390,430].map(width=>({name:`iphone-${width}`,use:{viewport:{width,height:844},isMobile:true,hasTouch:true}})),
  webServer:{command:'npm run dev',url:'http://127.0.0.1:3000',reuseExistingServer:!process.env.CI,timeout:120000}
});
