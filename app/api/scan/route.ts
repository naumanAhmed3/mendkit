import { NextResponse } from 'next/server';
import { launchBrowser } from '@/lib/browser';
import { scanInPage } from '@/lib/scan';
import type { Browser } from 'playwright-core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// POST /api/scan { url } — open the page in real Chromium and draft a
// resilient locator for every interactive element on it.
export async function POST(req: Request) {
  let url = '';
  try {
    ({ url } = await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  if (!url || !/^https?:\/\//.test(url)) {
    return NextResponse.json(
      { error: 'Provide an absolute http(s) URL' },
      { status: 400 },
    );
  }

  let browser: Browser | null = null;
  try {
    browser = await launchBrowser();
    const context = await browser.newContext({
      viewport: { width: 1200, height: 760 },
    });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 20_000 });
    const locators = await page.evaluate(scanInPage);
    await context.close();
    return NextResponse.json({ url, locators });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Scan failed' },
      { status: 500 },
    );
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}
