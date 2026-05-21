'use client';

import { useState } from 'react';
import type { ScannedLocator } from '@/lib/scan';

const SUGGESTIONS = [
  'https://quotes.toscrape.com/',
  'https://the-internet.herokuapp.com/login',
];

export function ScanForm() {
  const [url, setUrl] = useState(SUGGESTIONS[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    url: string;
    locators: ScannedLocator[];
  } | null>(null);

  const scan = async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Scan failed');
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!busy) scan();
        }}
        className="flex items-center gap-2.5"
      >
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          className="flex-1 h-10 rounded-lg bg-surface ring-1 ring-edge focus:ring-brand/50 px-3.5 text-[13px] font-mono outline-none transition"
        />
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-brand text-ink text-sm font-semibold hover:brightness-110 disabled:opacity-70 transition"
        >
          {busy && (
            <span className="w-3.5 h-3.5 rounded-full border-2 border-ink/30 border-t-ink mk-spin" />
          )}
          {busy ? 'Scanning…' : 'Scan page'}
        </button>
      </form>

      <div className="mt-2 flex items-center gap-2 flex-wrap">
        <span className="text-[11px] text-neutral-600">try:</span>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setUrl(s)}
            className="text-[11px] font-mono text-neutral-400 hover:text-brand"
          >
            {s}
          </button>
        ))}
      </div>

      {busy && (
        <p className="mt-4 text-[12.5px] text-neutral-500">
          Opening the page in real headless Chromium and capturing a resilient
          locator for every interactive element…
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-lg bg-bad/10 ring-1 ring-bad/25 px-4 py-3 text-[13px] text-bad">
          {error}
        </p>
      )}

      {result && (
        <section className="mt-6">
          <p className="text-[12.5px] text-neutral-400 mb-3">
            Captured{' '}
            <span className="text-brand font-medium">
              {result.locators.length}
            </span>{' '}
            resilient locators from{' '}
            <code className="font-mono text-neutral-500">{result.url}</code>
          </p>
          <div className="space-y-2">
            {result.locators.map((loc, i) => (
              <div
                key={i}
                className="rounded-xl bg-surface ring-1 ring-edge px-4 py-3"
              >
                <div className="flex items-baseline gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wide text-neutral-600">
                    {loc.role || loc.tag}
                  </span>
                  <code className="text-[12px] font-mono text-brand/90 break-all">
                    {loc.css}
                  </code>
                </div>
                <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                  {(
                    [
                      ['text', loc.text],
                      ['name', loc.name],
                      ['test-id', loc.testId],
                      ['tag', loc.tag],
                    ] as [string, string][]
                  )
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
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
