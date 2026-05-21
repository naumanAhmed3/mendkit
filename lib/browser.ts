import type { Browser } from 'playwright-core';

// ─────────────────────────────────────────────────────────────
// Launches headless Chromium, environment-aware:
//   • on Vercel → @sparticuz/chromium, a slim serverless build
//   • locally   → the system Google Chrome via the 'chrome' channel
// The @sparticuz/chromium major is pinned to match the Chromium that
// playwright-core expects (both 148) — a version gap there is the
// usual cause of serverless Playwright failing.
// ─────────────────────────────────────────────────────────────

export async function launchBrowser(): Promise<Browser> {
  const { chromium } = await import('playwright-core');

  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const sparticuz = (await import('@sparticuz/chromium')).default;
    sparticuz.setGraphicsMode = false;
    return chromium.launch({
      args: sparticuz.args,
      executablePath: await sparticuz.executablePath(),
      headless: true,
    });
  }

  return chromium.launch({ headless: true, channel: 'chrome' });
}
