import type { Locator } from './types';

export interface ResolveResult {
  found: boolean;
  healed: boolean;
  /** The selector to act on — the original css, or a fresh path when healed. */
  css: string;
  /** Which signals identified the element during a heal. */
  signals: string[];
  /** Confidence: 1 for a direct hit, else the heal match score. */
  score: number;
}

// ─────────────────────────────────────────────────────────────
// resolveInPage runs INSIDE the browser (via page.evaluate). It must
// be fully self-contained — no imports, no closure over module scope.
//
// Fast path: if the preferred CSS selector still matches, use it.
// Heal path: the markup changed, so score every plausible candidate
// against the locator's remaining signals (test-id, visible text,
// accessible name, tag) and, if one is confident enough, return a
// fresh stable selector for it.
// ─────────────────────────────────────────────────────────────

export function resolveInPage(loc: Locator): ResolveResult {
  const norm = (s: string | null | undefined): string =>
    (s || '').trim().replace(/\s+/g, ' ').toLowerCase();

  // Fast path — the preferred selector still resolves.
  try {
    if (loc.css && document.querySelector(loc.css)) {
      return { found: true, healed: false, css: loc.css, signals: [], score: 1 };
    }
  } catch {
    /* malformed selector — fall through to healing */
  }

  // Candidate pool, narrowed by the element's semantic role.
  const roleTags: Record<string, string[]> = {
    button: ['button', 'a', 'input'],
    link: ['a'],
    textbox: ['input', 'textarea'],
    combobox: ['select'],
    heading: ['h1', 'h2', 'h3', 'h4'],
  };
  const tags =
    loc.role && roleTags[loc.role]
      ? roleTags[loc.role]
      : loc.tag
        ? [loc.tag]
        : ['button', 'a', 'input', 'select', 'textarea', 'h1', 'h2', 'h3', 'span', 'p'];

  const escId = (id: string): string =>
    window.CSS && CSS.escape ? CSS.escape(id) : id;

  const accessibleName = (el: Element): string => {
    const id = el.getAttribute('id');
    const label = id
      ? document.querySelector('label[for="' + escId(id) + '"]')
      : null;
    const wrapping = el.closest('label');
    return norm(
      el.getAttribute('aria-label') ||
        el.getAttribute('placeholder') ||
        (label ? label.textContent : '') ||
        (wrapping ? wrapping.textContent : '') ||
        el.getAttribute('name') ||
        el.getAttribute('title') ||
        '',
    );
  };

  const wantText = norm(loc.text);
  const wantName = norm(loc.name);
  const wantTestId = norm(loc.testId);

  let pool: Element[] = [];
  for (const t of tags) {
    pool = pool.concat(Array.from(document.querySelectorAll(t)));
  }

  let best: Element | null = null;
  let bestScore = 0;
  let bestSignals: string[] = [];

  for (const el of pool) {
    let score = 0;
    const signals: string[] = [];

    if (wantTestId) {
      const tid = norm(el.getAttribute('data-testid'));
      if (tid && tid === wantTestId) {
        score += 0.5;
        signals.push('test-id');
      }
    }
    if (wantText) {
      const t = norm(el.textContent);
      if (t && t === wantText) {
        score += 0.45;
        signals.push('text');
      } else if (t && (t.includes(wantText) || wantText.includes(t))) {
        score += 0.2;
        signals.push('text');
      }
    }
    if (wantName) {
      const n = accessibleName(el);
      if (n && n === wantName) {
        score += 0.4;
        signals.push('name');
      } else if (n && (n.includes(wantName) || wantName.includes(n))) {
        score += 0.2;
        signals.push('name');
      }
    }
    if (loc.tag && el.tagName.toLowerCase() === loc.tag) {
      score += 0.08;
      signals.push('tag');
    }

    if (score > bestScore) {
      bestScore = score;
      best = el;
      bestSignals = signals;
    }
  }

  const THRESHOLD = 0.35;
  if (!best || bestScore < THRESHOLD) {
    return { found: false, healed: false, css: loc.css, signals: [], score: bestScore };
  }

  // Build a fresh, unique selector for the recovered element.
  const stablePath = (el: Element): string => {
    const id = el.getAttribute('id');
    if (id && document.querySelectorAll('#' + escId(id)).length === 1) {
      return '#' + escId(id);
    }
    const parts: string[] = [];
    let node: Element | null = el;
    while (node && node.nodeType === 1 && node.tagName.toLowerCase() !== 'html') {
      let sel = node.tagName.toLowerCase();
      const parent: Element | null = node.parentElement;
      if (parent) {
        const current = node;
        const sibs = Array.from(parent.children).filter(
          (c) => c.tagName === current.tagName,
        );
        if (sibs.length > 1) {
          sel += ':nth-of-type(' + (sibs.indexOf(current) + 1) + ')';
        }
      }
      parts.unshift(sel);
      node = node.parentElement;
    }
    return parts.join(' > ');
  };

  return {
    found: true,
    healed: true,
    css: stablePath(best),
    signals: Array.from(new Set(bestSignals)),
    score: Math.min(1, bestScore),
  };
}
