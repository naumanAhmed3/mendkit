import Link from 'next/link';
import { healEvents } from '@/lib/repo';
import type { HealEvent } from '@/lib/types';
import { percent, relativeTime } from '@/lib/format';
import { Nav } from '../nav';
import { SignalChip } from '../ui';

export const dynamic = 'force-dynamic';

export default async function HealsPage() {
  let events: HealEvent[] = [];
  let dbError = false;
  try {
    events = await healEvents(60);
  } catch {
    dbError = true;
  }

  return (
    <>
      <Nav active="heals" />
      <main className="max-w-4xl mx-auto px-6 py-10">
        <section className="mk-fade">
          <h1 className="text-xl font-semibold tracking-tight">Heal log</h1>
          <p className="mt-2 text-[14px] text-neutral-400 leading-relaxed max-w-2xl">
            Every time a preferred selector missed and the resolver recovered
            the element from its other signals. Each entry is the suggested
            permanent fix — the selector the flow should adopt.
          </p>
        </section>

        {dbError && (
          <p className="mt-6 rounded-lg bg-bad/10 ring-1 ring-bad/25 px-4 py-3 text-sm text-bad">
            Could not reach the database.
          </p>
        )}

        {!dbError && events.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-edge px-6 py-14 text-center">
            <h2 className="text-base font-medium text-neutral-200">
              No heals recorded yet
            </h2>
            <p className="mt-2 text-sm text-neutral-500 max-w-md mx-auto leading-relaxed">
              Run a flow against the mutating target — when its markup differs
              from what the flow was authored against, every recovered selector
              shows up here.
            </p>
          </div>
        )}

        {!dbError && events.length > 0 && (
          <div className="mt-7 space-y-2.5">
            {events.map((e, i) => (
              <Link
                key={`${e.runId}-${e.stepIdx}-${i}`}
                href={`/runs/${e.runId}`}
                className="block rounded-xl bg-surface ring-1 ring-edge hover:ring-heal/40 px-4 py-3 transition"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[13px] text-neutral-200 font-medium">
                    {e.stepLabel}
                  </span>
                  <span className="text-[11px] text-neutral-600">
                    in {e.flowName}
                  </span>
                  <span className="ml-auto text-[11px] text-neutral-600">
                    {relativeTime(e.createdAt)}
                  </span>
                </div>
                <div className="mt-2 text-[11.5px] leading-relaxed">
                  <code className="font-mono text-neutral-600 line-through break-all">
                    {e.originalCss}
                  </code>
                  <span className="text-neutral-600 mx-1.5">→</span>
                  <code className="font-mono text-heal break-all">
                    {e.resolvedCss}
                  </code>
                </div>
                <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                  {e.signals.map((s) => (
                    <SignalChip key={s} signal={s} />
                  ))}
                  <span className="text-[10.5px] font-mono text-neutral-500">
                    {percent(e.matchScore)} confidence
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
