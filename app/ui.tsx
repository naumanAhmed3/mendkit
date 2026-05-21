import type { RunStatus, StepAction, StepHealth } from '@/lib/types';

// ─────────────────────────────────────────────────────────────
// Small shared presentational components.
// ─────────────────────────────────────────────────────────────

export function RunStatusPill({ status }: { status: RunStatus }) {
  const passed = status === 'passed';
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-medium rounded-full px-2 py-0.5 ring-1 ${
        passed ? 'text-ok bg-ok/10 ring-ok/25' : 'text-bad bg-bad/10 ring-bad/25'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${passed ? 'bg-ok' : 'bg-bad'}`} />
      {passed ? 'passed' : 'failed'}
    </span>
  );
}

const HEALTH: Record<StepHealth, { dot: string; text: string; label: string }> = {
  healthy: { dot: 'bg-ok', text: 'text-ok', label: 'direct' },
  healed: { dot: 'bg-heal', text: 'text-heal', label: 'healed' },
  failed: { dot: 'bg-bad', text: 'text-bad', label: 'failed' },
  skipped: { dot: 'bg-neutral-600', text: 'text-neutral-500', label: 'skipped' },
};

export function HealthDot({ health }: { health: StepHealth }) {
  return (
    <span
      className={`w-2 h-2 rounded-full shrink-0 ${HEALTH[health].dot}`}
      title={health}
    />
  );
}

export function HealthBadge({ health }: { health: StepHealth }) {
  const h = HEALTH[health];
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10.5px] font-medium rounded-full px-2 py-0.5 ring-1 ring-current/20 ${h.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${h.dot}`} />
      {h.label}
    </span>
  );
}

const ACTION_LABEL: Record<StepAction, string> = {
  goto: 'GO TO',
  click: 'CLICK',
  fill: 'FILL',
  extract: 'EXTRACT',
  assertText: 'ASSERT',
};

export function ActionChip({ action }: { action: StepAction }) {
  return (
    <span className="text-[10px] font-mono font-semibold tracking-wide text-brand bg-brand/10 ring-1 ring-brand/20 rounded px-1.5 py-0.5">
      {ACTION_LABEL[action]}
    </span>
  );
}

export function SignalChip({ signal }: { signal: string }) {
  return (
    <span className="text-[10.5px] font-mono text-heal bg-heal/10 ring-1 ring-heal/25 rounded px-1.5 py-0.5">
      {signal}
    </span>
  );
}
