import type { Browser, Page } from 'playwright-core';
import type { Flow, FlowStep, RunStep, StepHealth } from './types';
import { resolveInPage, type ResolveResult } from './resolve';
import { launchBrowser } from './browser';
import { assertAllowedNavigation } from './security';

// ─────────────────────────────────────────────────────────────
// The MendKit engine. Like a normal browser-automation runner, but
// every element lookup goes through the self-healing resolver: the
// preferred CSS selector is tried first, and when it misses (the
// markup mutated) the element is recovered from its other signals and
// the step is marked `healed`.
// ─────────────────────────────────────────────────────────────

const STEP_TIMEOUT = 15_000;
const VIEWPORT = { width: 1200, height: 760 };

export interface ExecResult {
  status: 'passed' | 'failed';
  steps: RunStep[];
  extracted: Record<string, unknown>;
  error: string | null;
  durationMs: number;
  healCount: number;
}

export interface ExecOptions {
  /** Origin to resolve a relative startUrl (the bundled /target) against. */
  origin: string;
  /** Which mutation of the target page to hit. */
  targetVersion: number;
}

/** Resolve the flow's startUrl, appending the target version for /target. */
function resolveStartUrl(flow: Flow, opts: ExecOptions): string {
  if (/^https?:\/\//.test(flow.startUrl)) return flow.startUrl;
  const base = opts.origin.replace(/\/$/, '');
  const path = flow.startUrl.startsWith('/') ? flow.startUrl : '/' + flow.startUrl;
  return `${base}${path}?v=${opts.targetVersion}`;
}

export async function executeFlow(
  flow: Flow,
  opts: ExecOptions,
): Promise<ExecResult> {
  const startedAt = Date.now();
  const steps: RunStep[] = [];
  const extracted: Record<string, unknown> = {};
  let browser: Browser | null = null;
  let failed = false;
  let error: string | null = null;
  let healCount = 0;

  const allSteps: FlowStep[] = [
    { action: 'goto', label: 'Open the target page', url: resolveStartUrl(flow, opts) },
    ...flow.steps,
  ];

  try {
    browser = await launchBrowser();
    const context = await browser.newContext({ viewport: VIEWPORT });
    const originHost = new URL(opts.origin).hostname;
    await context.route('**/*', async (route) => {
      try { assertAllowedNavigation(route.request().url(), [originHost]); await route.continue(); }
      catch { await route.abort('blockedbyclient'); }
    });
    const page = await context.newPage();

    for (let idx = 0; idx < allSteps.length; idx++) {
      const step = allSteps[idx];

      if (failed) {
        steps.push(skippedStep(idx, step));
        continue;
      }

      const stepStart = Date.now();
      let health: StepHealth = 'healthy';
      let detail: string | null = null;
      let resolution: ResolveResult | null = null;
      let stepError: string | null = null;

      try {
        const r = await runStep(page, step, extracted);
        detail = r.detail;
        resolution = r.resolution;
        if (resolution?.healed) {
          health = 'healed';
          healCount++;
        }
      } catch (e) {
        health = 'failed';
        stepError = e instanceof Error ? e.message : String(e);
      }

      let screenshot: string | null = null;
      try {
        const buffer = await page.screenshot({ type: 'jpeg', quality: 50 });
        screenshot = buffer.toString('base64');
      } catch {
        /* page navigated away — skip */
      }

      steps.push({
        idx,
        action: step.action,
        label: step.label,
        health,
        durationMs: Date.now() - stepStart,
        originalCss: step.locator?.css ?? null,
        resolvedCss: resolution ? resolution.css : null,
        healed: resolution?.healed ?? false,
        healSignals: resolution?.signals ?? [],
        matchScore: resolution?.healed ? resolution.score : null,
        detail: health === 'failed' ? stepError : detail,
        screenshot,
      });

      if (health === 'failed') {
        failed = true;
        error = `Step ${idx + 1} — ${step.label}: ${stepError}`;
      }
    }

    await context.close();
  } catch (e) {
    failed = true;
    error = e instanceof Error ? e.message : String(e);
  } finally {
    if (browser) await browser.close().catch(() => {});
  }

  return {
    status: failed ? 'failed' : 'passed',
    steps,
    extracted,
    error,
    durationMs: Date.now() - startedAt,
    healCount,
  };
}

function skippedStep(idx: number, step: FlowStep): RunStep {
  return {
    idx,
    action: step.action,
    label: step.label,
    health: 'skipped',
    durationMs: 0,
    originalCss: step.locator?.css ?? null,
    resolvedCss: null,
    healed: false,
    healSignals: [],
    matchScore: null,
    detail: null,
    screenshot: null,
  };
}

interface StepOutcome {
  detail: string | null;
  resolution: ResolveResult | null;
}

async function runStep(
  page: Page,
  step: FlowStep,
  extracted: Record<string, unknown>,
): Promise<StepOutcome> {
  if (step.action === 'goto') {
    await page.goto(step.url!, { waitUntil: 'networkidle', timeout: STEP_TIMEOUT });
    return { detail: page.url(), resolution: null };
  }

  // extract-multiple does not heal — it is used against stable pages
  // where a list selector is expected to match many elements.
  if (step.action === 'extract' && step.multiple) {
    const loc = page.locator(step.locator!.css);
    const texts = await loc.allInnerTexts();
    const values = texts.map((t) => t.trim()).filter(Boolean);
    extracted[step.as!] = values;
    return { detail: `${values.length} values`, resolution: null };
  }

  // Everything else goes through the self-healing resolver.
  const resolution = await page.evaluate(resolveInPage, step.locator!);
  if (!resolution.found) {
    throw new Error(
      `could not resolve element (preferred selector "${step.locator!.css}" missed; best heal score ${resolution.score.toFixed(2)})`,
    );
  }

  const css = resolution.css;
  switch (step.action) {
    case 'click':
      await page.click(css, { timeout: STEP_TIMEOUT });
      return { detail: null, resolution };

    case 'fill':
      await page.fill(css, step.value ?? '', { timeout: STEP_TIMEOUT });
      return { detail: `typed "${step.value}"`, resolution };

    case 'extract': {
      const text = (await page.locator(css).first().innerText()).trim();
      extracted[step.as!] = text;
      return { detail: text.slice(0, 200), resolution };
    }

    case 'assertText': {
      const text = (await page.locator(css).first().innerText()).trim();
      if (!text.includes(step.contains ?? '')) {
        throw new Error(
          `expected text to contain "${step.contains}", got "${text.slice(0, 80)}"`,
        );
      }
      return { detail: text, resolution };
    }
  }

  return { detail: null, resolution };
}
