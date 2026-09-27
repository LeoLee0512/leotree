# Test entry points

`npm test` runs both groups and propagates failures:

- `test:product`: discovers every `*.test.ts` under `src/lib/` and `src/lib/knowledge-tree/` with the Node test runner. Invariants, cross-tab races, recovery, attachment bytes, backup, migration, learning history, the first-minute flow, math parsing and the public account contract.
- `test:platform`: discovers `scripts/*.test.mjs` (migration planning and other tooling helpers).

`test:build` checks the portable Node output, contained dependencies and PGLite binary assets. `test:browser:production` starts two owned production servers, verifies public/account behaviour and real browser/server restart, then runs both browser suites. It requires a production build and an installed Chrome. Results, screenshots, temporary credentials and profiles go to the ignored `release-evidence/` directory.

`test:browser:data` covers ten adversarial storage scenarios. `test:browser:learning` covers 390/430/desktop loops and both mobile maximum-font/landscape cases. `test:browser:beta` covers the first-minute flow. `RC_URL` overrides the local target. Keyboard occupancy is simulated by shrinking the viewport.

Historical acceptance reports are under `docs/history/`. The evidence files they cite were purged from git history to keep the repository small; the maintainer keeps the original archive offline.
