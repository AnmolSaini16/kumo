import type puppeteer from "@cloudflare/puppeteer";

import type { PageAction } from "./types";

type PuppeteerPage = Awaited<
  ReturnType<Awaited<ReturnType<typeof puppeteer.launch>>["newPage"]>
>;

export async function executeAction(
  page: PuppeteerPage,
  action: PageAction,
): Promise<void> {
  switch (action.type) {
    case "click":
      if (action.selector) {
        await page.waitForSelector(action.selector, {
          timeout: action.timeout || 5000,
        });
        await page.click(action.selector);
      }
      break;

    case "hover":
      if (action.selector) {
        await page.waitForSelector(action.selector, {
          timeout: action.timeout || 5000,
        });
        await page.hover(action.selector);
      }
      break;

    case "wait":
      // waitAfter doubles as the wait duration for this action type.
      await new Promise((r) => setTimeout(r, action.waitAfter || 1000));
      break;

    case "css":
      if (action.css) {
        await page.addStyleTag({ content: action.css });
      }
      break;
  }

  if (action.waitAfter && action.type !== "wait") {
    await new Promise((r) => setTimeout(r, action.waitAfter));
  }
}
