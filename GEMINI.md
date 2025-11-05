TASK: Project Phoenix - P2-S3: Backend Analytics & Core Business Reporting

**Goal:** Build comprehensive backend analytics and business reporting modules for accounts, transactions, debt/cashback ledgers, with API endpoints, tests, and docs. Ensure all implementation passes CI and deploys successfully on Vercel.

**Branch and Commits:**
- Create a new branch: `feat/P2-S3-backend-reporting`
- All commit messages must follow the format: `P2-S3: [type](scope) - [description]`

**Task 1: Implement Reporting API Endpoints**
1. Add new files:
   - `lib/reporting/accountReportLogic.ts` — account summaries, opening/closing balance per period.
   - `lib/reporting/categoryReportLogic.ts` — category spending summary.
   - `lib/reporting/debtCashbackReportLogic.ts` — historical debt and cashback movement analysis.
2. Create endpoint files:
   - `pages/api/reports/account-summary.ts`
   - `pages/api/reports/category-summary.ts`
   - `pages/api/reports/debt-cashback-summary.ts`
   - Each should accept filters (date range, account/category/personId) and support pagination and sorting where relevant.

**Task 2: Update Schema/Docs**
1. Update `docs/openapi.yaml` to document all new endpoints, sample payloads, response format, filter options, and error codes.
2. Add/Update markdown: `docs/reporting-guide.md` explaining typical use cases, example API queries.

**Task 3: Testing**
1. Write simulator/integration test script:
   - `test/test-reporting-api.js`
   - Script must cover:
     - CRUD + query for each new reporting endpoint.
     - Edge cases: missing/invalid filters, empty data, large result sets.
     - Performance (query with large dataset if possible).
   - All tests must pass in your local CI (Jest/Playwright or equivalent).
2. If using Vercel, make sure repo settings don’t block API reporting endpoints / ensure no serverless cold-start errors.

**Task 4: CI/CD & Vercel Deploy Checks**
1. Ensure every push to `feat/P2-S3-backend-reporting` triggers CI (lint, test).
2. All new files must pass linting, typecheck (if using TS), and test.
3. Deploy preview should pass with all endpoints working (no 500 or 404 from newly added endpoints).

---

**Deliverables:**
- All new/updated logic and endpoint files as above.
- Simulator/integration test script(s).
- Updated OpenAPI + docs/reporting-guide.
- Checklist that all API and test steps pass on Vercel deploy.
- If any edge cases are intentionally unsupported or delayed, list them in `docs/reporting-guide.md` under “Limitations”.

**Branch:** `feat/P2-S3-backend-reporting`
