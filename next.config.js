/** @type {import('next').NextConfig} */
const path = require('path');
const { execSync } = require('child_process');

// ant_executor#1846 (dasi#3 rollout, Agla 2026-08-18): fleet versioning
// standard — APP_VERSION is CalVer, derived at build time, never hand-
// maintained. Origin incident: Markette's package.json sat frozen at 26.6.0
// for ~150 commits — a dead signal nobody bumped. Structurally impossible
// here because there is nothing to forget: both values come from the build
// clock + git, every build, with no file a human edits.
//
// Format is fixed by Agla's ruling (supersedes any earlier "sha + date"
// text): YY.M.DD-HHmm — e.g. 26.8.18-2015 for 2026-08-18 20:15. Month has NO
// leading zero (matches the fleet's existing agents-* CalVer habit, v26.8.x);
// day/hour/minute do.
function calVerAppVersion() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const m = now.getMonth() + 1;
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${yy}.${m}.${dd}-${hh}${min}`;
}

function gitShortSha() {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    // Not fatal — a build outside a git checkout (rare) still stamps a
    // version, just without a commit identifier attached.
    return 'unknown';
  }
}

// ant_executor#1947 (from #1930's app-version template, cd4fad0): pin the
// Turbopack workspace root to THIS repo. DO NOT REMOVE.
//
// Next infers the "workspace root" by climbing UP from the project dir
// looking for a lockfile and picking the OUTERMOST one — see
// next/dist/lib/find-root.js (findRootDirAndLockFiles). The climb keys on
// LOCKFILES ONLY (pnpm-lock.yaml, package-lock.json, yarn.lock, bun.lock,
// bun.lockb); a bare package.json one level up does NOT trigger it, a stray
// package-lock.json one level up DOES. When it climbs, Turbopack silently
// compiles/resolves against the PARENT's tree instead of yours — a quiet,
// confusing local-dev/build failure. Vercel is unaffected (it checks out
// only your repo), which is exactly why it kept getting rediscovered one
// lane at a time (three independent hits before it was named).
//
// This file SEEDS new projects, which may be checked out ANYWHERE — so the
// pin has to travel with the seed. Fixing the parent directory of one
// machine's checkouts (bob#43) does not protect a repo that does not exist
// yet.
//
// Module format matters and is not a style choice: this config is CommonJS,
// so `__dirname` is correct here. In an ESM config (.mjs, or "type":"module")
// use `import.meta.dirname` instead — `import.meta` is a syntax error in CJS
// and `__dirname` is undefined in ESM. Both variants ship in the template at
// AgentsHead/Octopus/tools/templates/app-version/nextjs/.
const nextConfig = {
  reactStrictMode: true,
  // Turbopack builds (the Next 16 default):
  turbopack: { root: __dirname },
  // Non-Turbopack twin of the same setting, fed by the same lockfile climb.
  // Set because this config still defines a webpack() hook below.
  outputFileTracingRoot: __dirname,
  experimental: {
    missingSuspenseWithCSRBailout: false,

   },
  // Server-side only (no NEXT_PUBLIC_ prefix) — exposed via /api/health per
  // the standard, not meant to be bundled into client JS.
  env: {
    APP_VERSION: calVerAppVersion(),
    APP_COMMIT: gitShortSha(),
  },
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    return config;
   }
};

module.exports = nextConfig;
