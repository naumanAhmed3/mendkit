import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getRun, getRunSteps } from '@/lib/repo';
import type { RunStep } from '@/lib/types';
import { fmtDuration, fmtTime, percent } from '@/lib/format';
import { Nav } from '../../nav';
import { ActionChip, HealthBadge, RunStatusPill, SignalChip } from '../../ui';

export const dynamic = 'force-dynamic';

export default async function RunPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const run = await getRun(id);
  if (!run) notFound();
  const steps = await getRunSteps(id);
  const extracted = Object.entries(run.extracted ?? {});

  return (
    <>
      <Nav />
      <main className="max-w-3xl mx-auto px-6 py-10">
        <Link
          href={`/flows/${run.flowId}`}
          className="text-[12px] text-neutral-500 hover:text-neutral-300"
        >
          ← {run.flowName}
        </Link>

        <div className="mt-4 mk-fade">
          <div className="flex items-center gap-3">
            <RunStatusPill status={run.status} />
            <code className="text-[12px] font-mono text-neutral-500">
              {run.id}
            </code>
          </div>
          <h1 className="mt-2 text-xl font-semibold tracking-tight">
            {run.flowName}
          </h1>
          <div className="mt-2 flex items-center gap-2 flex-wrap text-[12px] font-mono text-neutral-500">
            <span className="text-brand/80">target v{run.targetVersion}</span>
            <span className="text-edge">·</span>
            <span>{fmtTime(run.startedAt)}</span>
            <span className="text-edge">·</span>
            <span>{run.stepCount} steps</span>
            <span className="text-edge">·</span>
            <span>{fmtDuration(run.durationMs)}</span>
          </div>
        </div>

        {/* Heal summary */}
        {run.healCount > 0 ? (
          <div className="mt-5 rounded-lg bg-heal/10 ring-1 ring-heal/25 px-4 py-3">
            <div className="text-[13px] text-neutral-200">
              <span className="text-heal font-semibold">
                Self-healed {run.healCount} selector
                {run.healCount === 1 ? '' : 's'}.
              </span>{' '}
              The target page was version {run.targetVersion}, so several
              preferred selectors no longer matched — the resolver recovered
              each element from its other signals.
            </div>
          </div>
        ) : run.targetVersion === 0 ? (
          <div className="mt-5 rounded-lg bg-surface ring-1 ring-edge px-4 py-3 text-[12.5px] text-neutral-400">
            Target version 0 — pristine markup. Every selector matched directly,
            so nothing needed healing.
          </div>
        ) : null}

        {run.error && (
          <div className="mt-4 rounded-lg bg-bad/10 ring-1 ring-bad/25 px-4 py-3">
            <div className="text-[11px] uppercase tracking-wide text-bad/80">
              Run failed
            </div>
            <code className="mt-1 block text-[12.5px] font-mono text-bad break-all">
              {run.error}
            </code>
          </div>
        )}

        {/* Extracted data */}
        {extracted.length > 0 && (
          <section className="mt-7">
            <h2 className="text-sm font-semibold text-neutral-300 mb-3">
              Extracted data
            </h2>
            <div className="rounded-xl ring-1 ring-edge bg-surface divide-y divide-edge-soft">
              {extracted.map(([key, value]) => (
                <div key={key} className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <code className="text-[12.5px] font-mono text-brand">
                      {key}
                    </code>
                    {Array.isArray(value) && (
                      <span className="text-[11px] text-neutral-600">
                        {value.length} items
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-[12.5px] text-neutral-400 leading-relaxed">
                    {Array.isArray(value)
                      ? value.slice(0, 14).join('  ·  ') +
                        (value.length > 14 ? '  …' : '')
                      : String(value)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Step timeline */}
        <section className="mt-7">
          <h2 className="text-sm font-semibold text-neutral-300 mb-3">
            Step timeline
          </h2>
          <div className="space-y-3">
            {steps.map((step) => (
              <StepCard key={step.idx} step={step} />
            ))}
          </div>
        </section>
      </main>
    </>
  );
}

function StepCard({ step }: { step: RunStep }) {
  const failed = step.health === 'failed';
  const skipped = step.health === 'skipped';
  return (
    <div
      className={`rounded-xl ring-1 overflow-hidden ${
        failed
          ? 'ring-bad/30 bg-bad/5'
          : step.health === 'healed'
            ? 'ring-heal/30 bg-heal/[0.04]'
            : 'ring-edge bg-surface'
      } ${skipped ? 'opacity-55' : ''}`}
    >
      <div className="flex items-center gap-3 px-4 py-2.5">
        <span className="text-[11px] font-mono text-neutral-600 w-5 text-right">
          {step.idx + 1}
        </span>
        <ActionChip action={step.action} />
        <span className="text-[13px] text-neutral-200 flex-1 min-w-0 truncate">
          {step.label}
        </span>
        <HealthBadge health={step.health} />
        {!skipped && (
          <span className="text-[11px] font-mono text-neutral-500 w-14 text-right">
            {fmtDuration(step.durationMs)}
          </span>
        )}
      </div>

      {/* Heal detail */}
      {step.healed && (
        <div className="mx-4 mb-2.5 rounded-lg bg-heal/8 ring-1 ring-heal/20 px-3 py-2.5">
          <div className="text-[11px] text-neutral-400 leading-relaxed">
            <span className="line-through text-neutral-600 font-mono">
              {step.originalCss}
            </span>{' '}
            missed — re-resolved to{' '}
            <code className="font-mono text-heal break-all">
              {step.resolvedCss}
            </code>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-mono uppercase tracking-wide text-neutral-600">
              matched on
            </span>
            {step.healSignals.map((s) => (
              <SignalChip key={s} signal={s} />
            ))}
            {step.matchScore !== null && (
              <span className="text-[10.5px] font-mono text-neutral-500">
                {percent(step.matchScore)} confidence
              </span>
            )}
          </div>
        </div>
      )}

      {/* Direct resolution / failure detail */}
      {!step.healed && step.detail && (
        <div
          className={`mx-4 mb-2.5 rounded-md px-2.5 py-1.5 text-[11.5px] font-mono break-all ${
            failed ? 'bg-bad/10 text-bad' : 'bg-surface-2 text-neutral-400'
          }`}
        >
          {failed ? step.detail : `→ ${step.detail}`}
        </div>
      )}

      {step.screenshot && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`data:image/jpeg;base64,${step.screenshot}`}
          alt={`Screenshot after step ${step.idx + 1}`}
          className="w-full max-h-[440px] object-cover object-top border-t border-edge-soft"
        />
      )}
    </div>
  );
}
