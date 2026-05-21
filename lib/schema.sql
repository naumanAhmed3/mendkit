-- MendKit schema — self-healing web automation.
-- Apply with: node --env-file=.env.local scripts/migrate.mjs

-- A flow: a named automation whose steps target elements through
-- resilient, multi-signal locators (stored in the JSON step list).
create table if not exists flows (
  id          text primary key,
  name        text not null,
  description text not null default '',
  start_url   text not null,
  steps       jsonb not null default '[]',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- A run: one execution of a flow against a particular mutation of the
-- target. heal_count is denormalised for fast dashboard reads.
create table if not exists runs (
  id             text primary key,
  flow_id        text not null references flows(id) on delete cascade,
  flow_name      text not null,
  status         text not null,                  -- passed | failed
  trigger        text not null default 'manual',
  target_version integer not null default 0,
  started_at     timestamptz not null,
  finished_at    timestamptz not null,
  duration_ms    integer not null,
  step_count     integer not null default 0,
  heal_count     integer not null default 0,
  error          text,
  extracted      jsonb not null default '{}',
  created_at     timestamptz not null default now()
);

create index if not exists runs_flow_idx   on runs (flow_id, created_at desc);
create index if not exists runs_recent_idx on runs (created_at desc);

-- One row per executed step. health records whether the element was
-- found directly, healed, failed, or skipped; the heal columns capture
-- what rescued it.
create table if not exists run_steps (
  run_id       text not null references runs(id) on delete cascade,
  idx          integer not null,
  action       text not null,
  label        text not null,
  health       text not null,                    -- healthy|healed|failed|skipped
  duration_ms  integer not null default 0,
  original_css text,
  resolved_css text,
  healed       boolean not null default false,
  heal_signals text[] not null default '{}',
  match_score  double precision,
  detail       text,
  screenshot   text,                             -- base64 JPEG
  primary key (run_id, idx)
);

-- Index for the heal log — every step that self-healed.
create index if not exists run_steps_heal_idx on run_steps (run_id)
  where healed;
