# MendKit — Self-Healing Web Automation

Browser automations break for one boring reason: a CSS selector stops matching
because the markup changed. MendKit fixes that. Every element is targeted not
by a single brittle selector but by a **bundle of signals** — visible text,
semantic role, accessible name, test-id, tag. When the preferred selector
misses, the resolver re-finds the element from the remaining signals, rewrites
the locator, and keeps going.

**Live demo:** https://mendkit.vercel.app

> Open a flow and press **Run flow now**. Each run hits a *randomly mutated*
> version of the bundled target page — its element ids and test-ids are
> scrambled — so you can watch MendKit heal the selectors that just broke.

---

## The idea

A normal locator:

```
#member-search          ← one selector, one point of failure
```

A MendKit **resilient locator**:

```
preferred:  #member-search
signals:    role=textbox · name="Search members" · test-id=member-search · tag=input
```

When `#member-search` no longer matches, the resolver scores every plausible
candidate on the page against those signals, picks the confident winner, and
returns a fresh stable selector for it. The step is marked `healed`, and the
heal — old selector → recovered selector, which signals rescued it, the
confidence score — is logged.

### The resolver

`lib/resolve.ts` runs **inside the page** (via `page.evaluate`). It is a pure,
self-contained scoring function:

| Signal | Weight (exact / partial) |
|---|---|
| `test-id` | 0.50 |
| visible `text` | 0.45 / 0.20 |
| accessible `name` | 0.40 / 0.20 |
| `tag` | 0.08 |

The best candidate above a 0.35 confidence threshold wins; a unique CSS path
is generated for it. Below threshold, the step fails honestly.

### Proving it works

You cannot demonstrate self-healing against a site that never changes, so
MendKit ships its own target: **`/target`**, a mock "Team Access Console"
whose markup is deterministically mutated by a `?v=N` parameter. Element ids
are always rewritten; test-ids are renamed or dropped; **text, roles and
accessible names are preserved** — exactly the signals healing leans on. Every
run picks a random version, so the demo is genuinely live, not staged.

A third sample flow runs against a real public site (`quotes.toscrape.com`) to
show the same resilient locators work off-mock — there is simply nothing
mutating, so they resolve directly.

### The builder

The **Locator scan** page is the authoring side: point MendKit at any URL and
it opens the page in real Chromium, walks every interactive element, and drafts
a resilient locator — preferred selector plus signal bundle — for each.

---

## Architecture

```
  Browser ──▶ Next.js (App Router) on Vercel
                │
                ├─ Dashboard ...... flows · run detail · heal log · scan
                ├─ /target ........ the mutating mock console (?v=N)
                │
                ├─ POST /api/flows/:id/run ─┐
                ├─ POST /api/scan ──────────┤
                │                           ▼
                │                  lib/executor.ts ── lib/browser.ts
                │                  ┌──────────────────────────────┐
                │                  │ launch headless Chromium     │
                │                  │  • Vercel → @sparticuz/...   │
                │                  │  • local  → system Chrome    │
                │                  │ per step: resolveInPage()    │
                │                  │   → direct hit, or heal      │
                │                  └──────────────────────────────┘
                │                           │
                └───────────────────────────┴──▶ Postgres (Neon)
                                                  flows · runs · run_steps
```

---

## Tech stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Playwright** (`playwright-core`) + **`@sparticuz/chromium`** — serverless execution
- **Postgres** (Neon) via `postgres.js` — hand-written SQL, no ORM
- **Tailwind CSS v4**
- **Vercel** — hosting, serverless functions (`maxDuration` 60s)

---

## Project structure

```
mendkit/
├── lib/
│   ├── types.ts       Locator / Flow / Run / RunStep / HealEvent
│   ├── schema.sql     flows · runs · run_steps
│   ├── resolve.ts     the in-page self-healing resolver  ← the core
│   ├── scan.ts        the in-page locator scanner
│   ├── mutation.ts    deterministic markup mutation for /target
│   ├── browser.ts     environment-aware Chromium launch
│   ├── executor.ts    the engine — resolve, act, screenshot, record
│   ├── flows.ts       three sample flows
│   ├── repo.ts        data access
│   └── db.ts / format.ts
├── app/
│   ├── page.tsx              overview
│   ├── flows/[id]/page.tsx   flow definition (resilient locators) + history
│   ├── runs/[id]/page.tsx    run detail — the heal timeline
│   ├── heals/page.tsx        the heal log
│   ├── scan/                 the locator-scan builder
│   ├── target/               the bundled mutating mock console
│   └── api/{seed,flows/[id]/run,scan}/route.ts
└── scripts/migrate.mjs
```

---

## Run it locally

Requires Node 20+, pnpm, a Postgres database, and Google Chrome installed.

```bash
pnpm install
echo 'DATABASE_URL=postgres://…' > .env.local
node --env-file=.env.local scripts/migrate.mjs
pnpm dev
```

Open http://localhost:3000, click **Load sample flows**, open a flow, and press
**Run flow now**. Locally the engine drives your installed Chrome.

---

## Design notes & limitations

- **Healing is logged, not silently persisted.** A run records the recovered
  selector and surfaces it in the heal log as the suggested permanent fix; the
  flow definition is left untouched so the demo keeps demonstrating healing.
  Auto-committing the fix is a one-line change to `recordRun`.
- **Multi-element extraction does not heal** — it is used against stable pages
  where a list selector is expected to match many nodes.
- **The resolver is heuristic**, deliberately. It is a transparent weighted
  score over accessibility-grade signals — easy to reason about and tune — not
  a model. An `OPENAI_API_KEY` could drive a natural-language flow builder on
  top of it, but the healing itself needs no LLM.
- Real Chromium runs synchronously inside the request, comfortably within the
  60-second function budget for these flows.

---

## License

MIT
