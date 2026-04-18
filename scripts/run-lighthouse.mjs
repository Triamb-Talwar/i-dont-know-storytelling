#!/usr/bin/env node
// Usage:
//   LHCI_URL=https://<your-site> pnpm lighthouse
//   LHCI_URL=https://<your-site> pnpm lighthouse -- --post-slug=foo
//
// Runs Lighthouse CI against the homepage + one sample post against a live URL,
// asserting the perf/a11y/seo/best-practices thresholds from lighthouserc.json.

import { spawnSync } from 'node:child_process';

const url = process.env.LHCI_URL;
if (!url) {
  console.error(
    '\n  missing LHCI_URL — set it to your live Netlify URL and re-run:\n' +
      '    LHCI_URL=https://your-site.netlify.app pnpm lighthouse\n',
  );
  process.exit(1);
}

const postArg = process.argv.find((a) => a.startsWith('--post-slug='));
const postSlug = postArg ? postArg.split('=')[1] : 'jonah-brute-force-sql';

const targets = [url, `${url.replace(/\/$/, '')}/posts/${postSlug}`];

const res = spawnSync(
  'npx',
  ['-y', '@lhci/cli@0.13', 'autorun', ...targets.flatMap((u) => [`--collect.url=${u}`])],
  { stdio: 'inherit', shell: true },
);
process.exit(res.status ?? 1);
