import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    include: ["**/*.browser.test.tsx"],
    setupFiles: ["./tests/setup-browser.css"],
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [{ browser: "chromium" }],
      expect: {
        toMatchScreenshot: {
          resolveScreenshotPath: (data) => {
            const path = resolve(
              data.root,
              data.testFileDirectory,
              "__screenshots__",
              data.testFileName,
              `${data.testName}-${data.browserName}-${data.platform}${data.ext}`,
            );
            console.log("[resolveScreenshotPath]", path);
            return path;
          },
        },
      },
    },
    testTimeout: 2_000,
  },
});
