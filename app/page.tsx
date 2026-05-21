import Link from 'next/link';
import {
  dashboardStats,
  latestRunPerFlow,
  listFlows,
  listRuns,
} from '@/lib/repo';
import type { Flow, Run } from '@/lib/types';
import { fmtDuration, percent, relativeTime } from '@/lib/format';
import { Nav } from './nav';
import { RunStatusPill } from './ui';
import { SeedButton } from './seed-button';

export const dynamic = 'force-dynamic';

export default async function Home() {
  let flows: Flow[] = [];
  let runs: Run[] = [];
  let latest: Record<string, Run> = {};
  let stats = { flowCount: 0, runCount: 0, healCount: 0, passRate: 0 };
  let dbError = false;

  try {
    [flows, runs, latest, stats] = await Promise.all([
      listFlows(),
      listRuns(10),
      latestRunPerFlow(),
      dashboardStats(),
    ]);
  } catch {
    dbError = true;
  }

  return (
    <>
      <Nav active="flows" />
      <main className="max-w-5xl mx-auto px-6 py-10">
        <section className="mk-fade">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Automations that survive a UI change.
          </h1>
          <p className="mt-2.5 text-[15px] text-neutral-400 max-w-2xl leading-relaxed">
            MendKit targets every element by a bundle of signals — text, role,
            accessible name, test-id — not one brittle selector. When the markup
            shifts and the preferred selector misses, the resolver re-finds the
            element and rewrites the locator. Run a flow to watch it heal.
          </p>
        </section>

        {dbError && (
          <p className="mt-6 rounded-lg bg-bad/10 ring-1 ring-bad/25 px-4 py-3 text-sm text-bad">
            Could not reach the database. Check the DATABASE_URL configuration.
          </p>
        )}

        {!dbError && flows.length === 0 && <EmptyState />}

        {!dbError && flows.length > 0 && (
          <>
            <section className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat label="Flows" value={String(stats.flowCount)} />
              <Stat label="Total runs" value={String(stats.runCount)} />
              <Stat
                label="Selectors healed"
                value={String(stats.healCount)}
                accent
              />
              <Stat
                label="Pass rate"
                value={stats.runCount ? percent(stats.passRate) : '—'}
              />
            </section>

            <section className="mt-10">
              <div className="flex items-center justify-between mb-3.5">
                <h2 className="text-sm font-semibold text-neutral-300">Flows</h2>
                <SeedButton label="Reset to samples" />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {flows.map((f) => (
                  <FlowCard key={f.id} flow={f} last={latest[f.id]} />
                ))}
              </div>
            </section>

            <section className="mt-10">
              <h2 className="text-sm font-semibold text-neutral-300 mb-3.5">
                Recent runs
              </h2>
              {runs.length === 0 ? (
                <p className="text-sm text-neutral-500 rounded-xl bg-surface ring-1 ring-edge px-4 py-6 text-center">
                  No runs yet. Open a flow and press{' '}
                  <span className="text-brand">Run flow now</span>.
                </p>
              ) : (
                <div className="rounded-xl ring-1 ring-edge overflow-hidden divide-y divide-edge-soft">
                  {runs.map((r) => (
                    <RunRow key={r.id} run={r} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl bg-surface ring-1 ring-edge px-4 py-3.5">
      <div className="text-[11px] uppercase tracking-wide text-neutral-500">
        {label}
      </div>
      <div
        className={`mt-1 text-2xl font-semibold tabular-nums ${accent ? 'text-heal' : ''}`}
      >
        {value}
      </div>
    </div>
  );
}

function FlowCard({ flow, last }: { flow: Flow; last?: Run }) {
  const isMock = flow.startUrl.startsWith('/');
  return (
    <Link
      href={`/flows/${flow.id}`}
      className="group rounded-xl bg-surface ring-1 ring-edge hover:ring-brand/40 p-4 transition flex flex-col"
    >
      <div className="flex items-start gap-3">
        <h3 className="font-medium text-[14.5px] text-neutral-100 group-hover:text-white leading-snug flex-1">
          {flow.name}
        </h3>
        {last ? (
          <RunStatusPill status={last.status} />
        ) : (
          <span className="text-[11px] text-neutral-600">never run</span>
        )}
      </div>
      <p className="mt-1.5 text-[12.5px] text-neutral-500 leading-relaxed line-clamp-2">
        {flow.description}
      </p>
      <div className="mt-3 pt-3 border-t border-edge-soft flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-mono text-neutral-400">
          {flow.steps.length + 1} steps
        </span>
        <span className="text-edge">·</span>
        <span className="text-[10.5px] font-mono text-neutral-500 bg-surface-2 ring-1 ring-edge rounded px-1.5 py-0.5">
          {isMock ? 'mutating target' : 'real site'}
        </span>
        {last && last.healCount > 0 && (
          <span className="ml-auto text-[10.5px] font-mono text-heal bg-heal/10 ring-1 ring-heal/25 rounded px-1.5 py-0.5">
            {last.healCount} healed
          </span>
        )}
      </div>
    </Link>
  );
}

function RunRow({ run }: { run: Run }) {
  return (
    <Link
      href={`/runs/${run.id}`}
      className="flex items-center gap-3 px-4 py-2.5 bg-surface hover:bg-surface-2 transition"
    >
      <RunStatusPill status={run.status} />
      <span className="text-[13px] text-neutral-200 truncate flex-1 min-w-0">
        {run.flowName}
      </span>
      {run.healCount > 0 && (
        <span className="text-[10.5px] font-mono text-heal bg-heal/10 ring-1 ring-heal/25 rounded px-1.5 py-0.5">
          {run.healCount} healed
        </span>
      )}
      <span className="text-[11px] font-mono text-neutral-600 hidden sm:block">
        v{run.targetVersion}
      </span>
      <span className="text-[11px] font-mono text-neutral-400 w-14 text-right">
        {fmtDuration(run.durationMs)}
      </span>
      <span className="text-[11px] text-neutral-600 w-16 text-right">
        {relativeTime(run.createdAt)}
      </span>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="mt-10 rounded-2xl border border-dashed border-edge px-6 py-14 text-center mk-fade">
      <h2 className="text-base font-medium text-neutral-200">No flows yet</h2>
      <p className="mt-2 mb-5 text-sm text-neutral-500 max-w-md mx-auto leading-relaxed">
        Load the sample flows, then run one against the mutating target to watch
        MendKit heal selectors the markup just broke.
      </p>
      <div className="flex justify-center">
        <SeedButton />
      </div>
    </div>
  );
}
