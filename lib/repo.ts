import { randomBytes } from 'node:crypto';
import { db } from './db';
import { sampleFlows } from './flows';
import type { ExecResult } from './executor';
import type { Flow, HealEvent, Run, RunStep, RunTrigger } from './types';

// ─────────────────────────────────────────────────────────────
// Data access. Hand-written SQL over postgres.js — no ORM.
// ─────────────────────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */

function mapFlow(r: any): Flow {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    startUrl: r.start_url,
    steps: r.steps,
    createdAt: new Date(r.created_at).toISOString(),
    updatedAt: new Date(r.updated_at).toISOString(),
  };
}

function mapRun(r: any): Run {
  return {
    id: r.id,
    flowId: r.flow_id,
    flowName: r.flow_name,
    status: r.status,
    trigger: r.trigger,
    targetVersion: r.target_version,
    startedAt: new Date(r.started_at).toISOString(),
    finishedAt: new Date(r.finished_at).toISOString(),
    durationMs: r.duration_ms,
    stepCount: r.step_count,
    healCount: r.heal_count,
    error: r.error,
    extracted: r.extracted,
    createdAt: new Date(r.created_at).toISOString(),
  };
}

function mapStep(r: any): RunStep {
  return {
    idx: r.idx,
    action: r.action,
    label: r.label,
    health: r.health,
    durationMs: r.duration_ms,
    originalCss: r.original_css,
    resolvedCss: r.resolved_css,
    healed: r.healed,
    healSignals: r.heal_signals,
    matchScore: r.match_score,
    detail: r.detail,
    screenshot: r.screenshot,
  };
}

// ── Flows ────────────────────────────────────────────────────

export async function listFlows(): Promise<Flow[]> {
  const rows = await db()`select * from flows order by name`;
  return rows.map(mapFlow);
}

export async function getFlow(id: string): Promise<Flow | null> {
  const rows = await db()`select * from flows where id = ${id}`;
  return rows.length ? mapFlow(rows[0]) : null;
}

/** Replace all flows (and, by cascade, all runs) with the samples. */
export async function seedFlows(): Promise<number> {
  const sql = db();
  const flows = sampleFlows();
  await sql.begin(async (tx) => {
    await tx`delete from flows`;
    for (const f of flows) {
      await tx`
        insert into flows (id, name, description, start_url, steps)
        values (${f.id}, ${f.name}, ${f.description}, ${f.startUrl},
                ${sql.json(f.steps as any)})`;
    }
  });
  return flows.length;
}

// ── Runs ─────────────────────────────────────────────────────

export async function recordRun(
  flow: Flow,
  trigger: RunTrigger,
  targetVersion: number,
  result: ExecResult,
): Promise<string> {
  const id = 'run_' + randomBytes(5).toString('hex');
  const finishedAt = new Date();
  const startedAt = new Date(finishedAt.getTime() - result.durationMs);
  const sql = db();

  await sql.begin(async (tx) => {
    await tx`
      insert into runs (id, flow_id, flow_name, status, trigger, target_version,
                        started_at, finished_at, duration_ms, step_count,
                        heal_count, error, extracted)
      values (${id}, ${flow.id}, ${flow.name}, ${result.status}, ${trigger},
              ${targetVersion}, ${startedAt}, ${finishedAt}, ${result.durationMs},
              ${result.steps.length}, ${result.healCount}, ${result.error},
              ${sql.json(result.extracted as any)})`;
    for (const s of result.steps) {
      await tx`
        insert into run_steps (run_id, idx, action, label, health, duration_ms,
                               original_css, resolved_css, healed, heal_signals,
                               match_score, detail, screenshot)
        values (${id}, ${s.idx}, ${s.action}, ${s.label}, ${s.health},
                ${s.durationMs}, ${s.originalCss}, ${s.resolvedCss}, ${s.healed},
                ${s.healSignals}, ${s.matchScore}, ${s.detail}, ${s.screenshot})`;
    }
  });
  return id;
}

export async function listRuns(limit = 30): Promise<Run[]> {
  const rows = await db()`
    select * from runs order by created_at desc limit ${limit}`;
  return rows.map(mapRun);
}

export async function runsForFlow(flowId: string, limit = 20): Promise<Run[]> {
  const rows = await db()`
    select * from runs where flow_id = ${flowId}
    order by created_at desc limit ${limit}`;
  return rows.map(mapRun);
}

export async function latestRunPerFlow(): Promise<Record<string, Run>> {
  const rows = await db()`
    select distinct on (flow_id) * from runs
    order by flow_id, created_at desc`;
  const out: Record<string, Run> = {};
  for (const r of rows) out[r.flow_id] = mapRun(r);
  return out;
}

export async function getRun(id: string): Promise<Run | null> {
  const rows = await db()`select * from runs where id = ${id}`;
  return rows.length ? mapRun(rows[0]) : null;
}

export async function getRunSteps(runId: string): Promise<RunStep[]> {
  const rows = await db()`
    select * from run_steps where run_id = ${runId} order by idx`;
  return rows.map(mapStep);
}

// ── Heal log ─────────────────────────────────────────────────

export async function healEvents(limit = 40): Promise<HealEvent[]> {
  const rows = await db()`
    select s.run_id, s.idx, s.label, s.original_css, s.resolved_css,
           s.heal_signals, s.match_score, r.flow_id, r.flow_name, r.created_at
    from run_steps s
    join runs r on r.id = s.run_id
    where s.healed
    order by r.created_at desc, s.idx
    limit ${limit}`;
  return rows.map((r: any) => ({
    runId: r.run_id,
    flowId: r.flow_id,
    flowName: r.flow_name,
    stepIdx: r.idx,
    stepLabel: r.label,
    originalCss: r.original_css,
    resolvedCss: r.resolved_css,
    signals: r.heal_signals,
    matchScore: r.match_score,
    createdAt: new Date(r.created_at).toISOString(),
  }));
}

// ── Dashboard ────────────────────────────────────────────────

export interface DashboardStats {
  flowCount: number;
  runCount: number;
  healCount: number;
  passRate: number;
}

export async function dashboardStats(): Promise<DashboardStats> {
  const [flows] = await db()`select count(*)::int as n from flows`;
  const [runs] = await db()`
    select
      count(*)::int as n,
      count(*) filter (where status = 'passed')::int as passed,
      coalesce(sum(heal_count), 0)::int as heals
    from runs`;
  return {
    flowCount: flows.n,
    runCount: runs.n,
    healCount: runs.heals,
    passRate: runs.n > 0 ? runs.passed / runs.n : 0,
  };
}
