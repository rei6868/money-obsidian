TASK: Project Dragon - P2-S4: Business Automation & Scheduled Backend Jobs

**Goal:** Develop job scheduler, auto-reconciliation, business workflow automation for transactions, debts, cashback, reporting. All new features must pass CI and be ready for Vercel deploy.

**Branch and Commits:**
- Create a new branch: `feat/P2-S4-business-automation`
- All commit messages must follow format: `P2-S4: [type](scope) - [description]`

**Task 1: Implement Backend Job Scheduler**
1. Add file: `lib/automation/jobScheduler.ts`
   - Support scheduling daily, weekly, monthly jobs via cron or backend timer (use node-cron or similar).
   - Must include jobs for:
     - Auto-reconcile daily balances for all accounts.
     - Scheduled generation of monthly reports and summary stats.
     - Periodic auditing/fixing of broken ledger records (debt/cashback out-of-sync).

2. Add command-line entrypoint:
   - `scripts/runJobs.ts` — runnable for local or CI job simulation/testing.
   - Accept job name (`--job reconcile`, `--job report`, etc.) and date/time filters.
   - Ensure CI can invoke and pass (simulate jobs, verify DB changes).

**Task 2: Extend Integration/Automation Logic**
1. Update (or add) endpoints:
   - `pages/api/automation/run-job.ts` — API to trigger jobs manually (for admin/operator/automation tool).
   - Document endpoint and payload in `docs/openapi.yaml` and `docs/automation-guide.md`.

**Task 3: Automated Tests**
1. Write test script:
   - `test/test-automation-api.js`
     - Must simulate job runs, check DB/post-job output, verify error handling.
     - Cover edge cases: empty data, race conditions, incomplete/failing job recovery.

2. Ensure all jobs and API automation pass CI, lint, and test.

**Task 4: Docs & Usage**
1. Update/Create documents:
   - `docs/automation-guide.md` — detail jobs, schedule, failure handling, recovery process.
   - API doc update with example job trigger.

---

**Deliverables:**
- All logic & endpoint files for backend jobs and automation.
- Simulator/test scripts for jobs (local + CI pass confirmed).
- Updated docs/openapi & `automation-guide.md`.
- Checklist for admin/operator to test jobs before/after deployment.

**Branch:** `feat/P2-S4-business-automation`
