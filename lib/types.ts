// ─────────────────────────────────────────────────────────────
// MendKit — shared types
// ─────────────────────────────────────────────────────────────

/**
 * A resilient locator. Instead of a single brittle CSS selector, an
 * element is described by a bundle of signals. If the preferred `css`
 * stops matching (the markup changed), the resolver re-finds the
 * element by scoring candidates against the remaining signals.
 */
export interface Locator {
  /** Preferred CSS selector — fast path. */
  css: string;
  /** Visible text content. */
  text?: string;
  /** Semantic role: button | link | textbox | combobox | heading. */
  role?: string;
  /** Accessible name — aria-label, placeholder, label, name attr. */
  name?: string;
  /** data-testid, if the element had one when captured. */
  testId?: string;
  /** Lowercased tag name. */
  tag?: string;
}

export type StepAction = 'goto' | 'click' | 'fill' | 'extract' | 'assertText';

export interface FlowStep {
  action: StepAction;
  label: string;
  url?: string; // goto
  locator?: Locator; // click | fill | extract | assertText
  value?: string; // fill
  as?: string; // extract — variable name
  multiple?: boolean; // extract — collect all matches
  contains?: string; // assertText
}

export interface Flow {
  id: string;
  name: string;
  description: string;
  startUrl: string; // absolute, or '/target' for the bundled mock
  steps: FlowStep[];
  createdAt: string;
  updatedAt: string;
}

/** How a step's element resolved. */
export type StepHealth = 'healthy' | 'healed' | 'failed' | 'skipped';

export type RunStatus = 'passed' | 'failed';
export type RunTrigger = 'manual' | 'api';

export interface RunStep {
  idx: number;
  action: StepAction;
  label: string;
  health: StepHealth;
  durationMs: number;
  /** The selector the flow asked for. */
  originalCss: string | null;
  /** The selector that actually worked (differs from original when healed). */
  resolvedCss: string | null;
  healed: boolean;
  /** Which signals identified the element when the css selector missed. */
  healSignals: string[];
  /** Match confidence, 0..1, when healed. */
  matchScore: number | null;
  detail: string | null; // extracted value, asserted text, or error
  screenshot: string | null; // base64 JPEG
}

export interface Run {
  id: string;
  flowId: string;
  flowName: string;
  status: RunStatus;
  trigger: RunTrigger;
  /** Which mutation of the target page this run hit (0 = pristine). */
  targetVersion: number;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  stepCount: number;
  healCount: number;
  error: string | null;
  extracted: Record<string, unknown>;
  createdAt: string;
}

/** One self-heal event, surfaced in the heal log. */
export interface HealEvent {
  runId: string;
  flowId: string;
  flowName: string;
  stepIdx: number;
  stepLabel: string;
  originalCss: string;
  resolvedCss: string;
  signals: string[];
  matchScore: number;
  createdAt: string;
}
