// ─────────────────────────────────────────────────────────────
// The bundled target page (/target) is a mock "Team Access Console".
// Its markup is deterministically mutated by a `v` query parameter so
// self-healing is demonstrable on demand: every run hits a different
// version, the flow's preferred selectors miss, and the resolver has
// to recover each element from its other signals.
//
// What mutates: element ids (always) and data-testids (renamed or
// dropped). What never changes: visible text, accessible names, tags
// and roles — the signals healing leans on.
// ─────────────────────────────────────────────────────────────

export type TargetKey =
  | 'heading'
  | 'search'
  | 'invite'
  | 'exportBtn'
  | 'count'
  | 'settings'
  | 'inviteHeading'
  | 'inviteEmail'
  | 'inviteSend';

/** Canonical (version 0) ids — what the sample flows are authored against. */
export const CANONICAL: Record<TargetKey, string> = {
  heading: 'console-heading',
  search: 'member-search',
  invite: 'invite-member-btn',
  exportBtn: 'export-csv-btn',
  count: 'member-count',
  settings: 'settings-link',
  inviteHeading: 'invite-panel-heading',
  inviteEmail: 'invite-email',
  inviteSend: 'invite-send-btn',
};

export interface ElementAttrs {
  id: string;
  testId: string | null;
}

const KEYS = Object.keys(CANONICAL) as TargetKey[];

// Small deterministic PRNG (Lehmer) so a given `v` always mutates the
// same way — runs are reproducible.
function rng(seed: number): () => number {
  let s = (seed * 2654435761) % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

/** Resolve the id + test-id for every target element at version `v`. */
export function mutation(v: number): Record<TargetKey, ElementAttrs> {
  const out = {} as Record<TargetKey, ElementAttrs>;

  if (v <= 0) {
    for (const k of KEYS) out[k] = { id: CANONICAL[k], testId: CANONICAL[k] };
    return out;
  }

  const rand = rng(v);
  for (const k of KEYS) {
    const hash = Math.floor(rand() * 1.68e7).toString(36);
    out[k] = {
      id: `el-${hash}`,
      // The test-id is renamed or dropped entirely — so it cannot be
      // relied on either; healing must fall back to text / name.
      testId: rand() > 0.5 ? `tid-${hash}` : null,
    };
  }
  return out;
}

/** Number of distinct mutated versions a run may target. */
export const MAX_VERSION = 6;

/** Pick a target version for a run — biased toward the mutated ones. */
export function pickVersion(): number {
  // ~1 in 7 runs hits the pristine page (everything healthy).
  return Math.floor(Math.random() * (MAX_VERSION + 1));
}
