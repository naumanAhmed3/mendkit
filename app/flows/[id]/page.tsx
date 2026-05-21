import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getFlow, runsForFlow } from '@/lib/repo';
import type { FlowStep, Locator } from '@/lib/types';
import { fmtDuration, hostOf, relativeTime } from '@/lib/format';
import { Nav } from '../../nav';
import { ActionChip, RunStatusPill } from '../../ui';
import { RunButton } from '../../run-button';

export const dynamic = 'force-dynamic';

export default async function FlowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const flow = await getFlow(id);
  if (!flow) notFound();

  const runs = await runsForFlow(flow.id);
  const isMock = flow.startUrl.startsWith('/');

  return (
    <>
      <Nav active="flows" />
      <main className="max-w-4xl mx-auto px-6 py-10">
        <Link
          href="/"
          className="text-[12px] text-neutral-500 hover:text-neutral-300"
        >
          ← All flows
        </Link>

        <div className="mt-4 flex items-start gap-4 mk-fade">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold tracking-tight">{flow.name}</h1>
            <p className="mt-2 text-[14px] text-neutral-400 leading-relaxed max-w-2xl">
              {flow.description}
            </p>
            <div className="mt-3 flex items-center gap-2 flex-wrap text-[11px] font-mono text-neutral-500">
              <span className="text-brand/90">
                {isMock ? 'target: bundled mutating console' : hostOf(flow.startUrl)}
              </span>
              <span className="text-edge">·</span>
              <span>{flow.steps.length + 1} steps</span>
            </div>
          </div>
          <RunButton flowId={flow.id} />
        </div>

        {isMock && (
          <p className="mt-5 rounded-lg bg-heal/8 ring-1 ring-heal/20 px-4 py-2.5 text-[12.5px] text-neutral-300">
            Each run hits a randomly mutated version of the target page, so the
            preferred CSS selectors below will often miss — and the resolver
            will heal them from the other signals.
          </p>
        )}

        {/* Steps */}
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-neutral-300 mb-3">
            Flow definition · resilient locators
          </h2>
          <ol className="space-y-2.5">
            <li className="rounded-xl bg-surface ring-1 ring-edge px-4 py-3 flex items-center gap-3">
              <span className="text-[11px] font-mono text-neutral-600 w-5 text-right">
                1
              </span>
              <ActionChip action="goto" />
              <span className="text-[13px] text-neutral-200">
                Open the target page
              </span>
            </li>
            {flow.steps.map((step, i) => (
              <li
                key={i}
                className="rounded-xl bg-surface ring-1 ring-edge px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-mono text-neutral-600 w-5 text-right">
                    {i + 2}
                  </span>
                  <ActionChip action={step.action} />
                  <span className="text-[13px] text-neutral-200">
                    {step.label}
                  </span>
                  {step.value !== undefined && (
                    <code className="text-[11px] font-mono text-neutral-500">
                      = &quot;{step.value}&quot;
                    </code>
                  )}
                </div>
                {step.locator && (
                  <div className="mt-2.5 ml-8">
                    <LocatorBundle locator={step.locator} multiple={step.multiple} />
                  </div>
                )}
              </li>
            ))}
          </ol>
        </section>

        {/* Run history */}
        <section className="mt-9">
          <h2 className="text-sm font-semibold text-neutral-300 mb-3">
            Run history
          </h2>
          {runs.length === 0 ? (
            <p className="text-sm text-neutral-500 rounded-xl bg-surface ring-1 ring-edge px-4 py-6 text-center">
              This flow has not run yet. Press{' '}
              <span className="text-brand">Run flow now</span> above.
            </p>
          ) : (
            <div className="rounded-xl ring-1 ring-edge overflow-hidden divide-y divide-edge-soft">
              {runs.map((r) => (
                <Link
                  key={r.id}
                  href={`/runs/${r.id}`}
                  className="flex items-center gap-3 px-4 py-2.5 bg-surface hover:bg-surface-2 transition"
                >
                  <RunStatusPill status={r.status} />
                  <span className="text-[12px] font-mono text-neutral-600">
                    target v{r.targetVersion}
                  </span>
                  {r.healCount > 0 && (
                    <span className="text-[10.5px] font-mono text-heal bg-heal/10 ring-1 ring-heal/25 rounded px-1.5 py-0.5">
                      {r.healCount} healed
                    </span>
                  )}
                  <span className="text-[12px] font-mono text-neutral-400 ml-auto w-14 text-right">
                    {fmtDuration(r.durationMs)}
                  </span>
                  <span className="text-[11px] text-neutral-600 w-16 text-right">
                    {relativeTime(r.createdAt)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}

function LocatorBundle({
  locator,
  multiple,
}: {
  locator: Locator;
  multiple?: boolean;
}) {
  const signals: [string, string | undefined][] = [
    ['text', locator.text],
    ['role', locator.role],
    ['name', locator.name],
    ['test-id', locator.testId],
    ['tag', locator.tag],
  ];
  return (
    <div className="rounded-lg bg-ink/60 ring-1 ring-edge-soft px-3 py-2">
      <div className="flex items-baseline gap-2">
        <span className="text-[10px] font-mono uppercase tracking-wide text-neutral-600">
          preferred
        </span>
        <code className="text-[11.5px] font-mono text-brand/90 break-all">
          {locator.css}
        </code>
        {multiple && (
          <span className="text-[10px] font-mono text-neutral-600">
            (matches many)
          </span>
        )}
      </div>
      {!multiple && (
        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-mono uppercase tracking-wide text-neutral-600">
            fallback signals
          </span>
          {signals
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <span
                key={k}
                className="text-[10.5px] font-mono text-neutral-400 bg-surface-2 ring-1 ring-edge rounded px-1.5 py-0.5"
              >
                {k}: {v}
              </span>
            ))}
        </div>
      )}
    </div>
  );
}
