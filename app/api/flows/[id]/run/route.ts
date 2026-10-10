import { NextResponse } from 'next/server';
import { getFlow, recordRun } from '@/lib/repo';
import { executeFlow } from '@/lib/executor';
import { pickVersion } from '@/lib/mutation';
import { requireAdmin } from '@/lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// POST /api/flows/:id/run — execute the flow against a freshly mutated
// version of the target and record the run.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;
  const { id } = await params;
  try {
    const flow = await getFlow(id);
    if (!flow) {
      return NextResponse.json({ error: 'Flow not found' }, { status: 404 });
    }

    // Resolve the app's own public origin so the executor can reach the
    // bundled /target page that relative flow URLs point at.
    const host = req.headers.get('host') ?? 'localhost:3000';
    const proto =
      req.headers.get('x-forwarded-proto') ??
      (host.startsWith('localhost') ? 'http' : 'https');
    const origin = `${proto}://${host}`;

    const targetVersion = pickVersion();
    const result = await executeFlow(flow, { origin, targetVersion });
    const runId = await recordRun(flow, 'manual', targetVersion, result);

    return NextResponse.json({
      runId,
      status: result.status,
      healCount: result.healCount,
      targetVersion,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Run failed' },
      { status: 500 },
    );
  }
}
