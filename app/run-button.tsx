'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

// Triggers a live run. The request executes a real headless Chromium
// server-side against a freshly mutated target, so the button holds a
// long loading state and then opens the recorded run.
export function RunButton({ flowId }: { flowId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/flows/${flowId}/run`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.runId) throw new Error(data.error || 'Run failed');
      router.push(`/runs/${data.runId}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Run failed');
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        onClick={run}
        disabled={busy}
        className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-brand text-ink text-sm font-semibold hover:brightness-110 disabled:opacity-70 transition"
      >
        {busy ? (
          <>
            <span className="w-3.5 h-3.5 rounded-full border-2 border-ink/30 border-t-ink mk-spin" />
            Running flow…
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
            Run flow now
          </>
        )}
      </button>
      {busy && (
        <span className="text-[11px] text-neutral-500">
          Mutating the target, launching Chromium — ~20–40s.
        </span>
      )}
      {error && <span className="text-[11px] text-bad">{error}</span>}
    </div>
  );
}
