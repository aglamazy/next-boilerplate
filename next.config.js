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

const nextConfig = {
  reactStrictMode: true,
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
