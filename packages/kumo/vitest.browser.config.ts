import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    include: ["**/*.browser.test.tsx"],
    setupFiles: ["./tests/setup-browser.css"],
    browser: {
      enabled: true,
      provider: playwright(),
      // https://vitest.dev/config/browser/playwright
      instances: [{ browser: "chromium" }],
      expect: {
        toMatchScreenshot: {
          /**
           * Store reference screenshots in __screenshots__/ next to test files.
           * Includes browser and platform in the filename so darwin/linux
           * screenshots don't collide (font rendering differs across platforms).
           */
          resolveScreenshotPath: ({
            testFileDirectory,
            testFileName,
            testName,
            browserName,
            platform,
            ext,
          }) =>
            `${testFileDirectory}/__screenshots__/${testFileName}/${testName}-${browserName}-${platform}${ext}`,
        },
      },
    },
    /**
     * Intentionally tiny timeout because components should render quick
     */
    testTimeout: 2_000,
  },
});
