import { NextResponse } from 'next/server';

// ant_executor#1846 (dasi#3 rollout, Agla 2026-08-18): fleet versioning
// standard, compliance checklist item 2 — "Version exposed at a queryable
// surface (health route or header)". APP_VERSION/APP_COMMIT are stamped at
// build time by next.config.js (CalVer + git short sha, never hand-
// maintained) — this route makes that a queryable STATE a deploy-gate check
// can assert freshness against, not just a build log line
// (docs/control-proof-principle.md).
//
// A copy-of-this-template product repo with its own health checks (DB,
// third-party services, etc — see FamCircle's /api/health for that shape)
// should extend this route with those checks rather than replace it; keep
// app_version/app_commit in the response either way.
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    ok: true,
    app_version: process.env.APP_VERSION || 'unknown',
    app_commit: process.env.APP_COMMIT || 'unknown',
  });
}
