# PX-P1 Transaction Engine Audit & Planning

## 1. Multi-ledger Logic Snapshot
- **Transaction ingestion (current API)** – `POST /api/transactions` persists the core row then inlines debt-side effects (ledger lookup, aggregate math, movement insert) inside the route handler `pages/api/transactions/index.ts:210`. The debt branch is only executed when `body.personId` and `body.debtMovement` are present `pages/api/transactions/index.ts:229`, leaving cashback and other ledger types untouched.
- **Debt movements & ledger** – Debt inserts update `debt_ledger` fields (`newDebt`, `repayments`, `debtDiscount`, `netDebt`) and append a movement row with `status = 'active'` `pages/api/transactions/index.ts:249`. Aggregated values surface back into the table view through a CTE in `getTransactionsTable` `lib/api/transactions/transactions.table.ts:452` and via the dataset fallback `lib/api/transactions/transactions.dataset.ts:156`.
- **Cashback linkage** – Table queries already join cashback movements to derive `percentBack`, `fixedBack`, `totalBack`, and cycle tags `lib/api/transactions/transactions.table.ts:452`. The dataset loader mirrors this by folding `cashbackMovements` rows into each record `lib/api/transactions/transactions.dataset.ts:206`. However, no creation or mutation path currently emits cashback movements or touches `cashback_ledger`.
- **Audit history** – Update/delete routes record transactional diffs (`amount`, cashback totals, debt totals) into `transaction_history` with sequencing for replay `pages/api/transactions/[id].ts:200`. History rows drive debt/cashback change visibility but depend on the missing movement writers above.
- **Linked transactions** – The schema exposes `linked_transactions` (types `refund`, `split`, `batch`, `settle`) `src/db/schema/transactions.ts:156`, yet no service populates `linkedTxnId` groups during ingestion. Existing UI/table code expects this mapping, so multi-step ledger flows currently lack orchestration.

## 2. Missing & Legacy Logic (Phase 1 Scope)
- **Stubbed logic layer** – All domain helpers under `lib/logic` are placeholders (returning inputs without touching the database) `lib/logic/transactionsLogic.ts:3`, `lib/logic/debtLedgerLogic.ts:3`, `lib/logic/cashbackLedgerLogic.ts:3`. Phase 1 must replace these with real transaction, debt, and cashback engines callable from API routes and background jobs.
- **Dual JS/TS artifacts** – Compiled `.js` siblings live beside the TypeScript stubs in `lib/logic`. These are legacy leftovers from earlier builds and risk diverging behaviour. Plan to delete or regenerate them once the new modules are in place so only one source of truth remains.
- **Enum drift** – `lib/transactions/transactionTypes.ts:1` still exposes legacy values (`expenses`, `transfer`, `other`) that no longer match the canonical Drizzle enum (`expense`, `repayment`, `import`, `subscription`) `src/db/schema/transactions.ts:25`. Any Phase 1 business rules need a unified enum adapter to prevent rejected inserts.
- **Cashback gaps** – There is no code path that creates `cashback_movements` or updates `cashback_ledger`, so UI totals rely solely on manual seed data. Missing modules must compute percent/fixed payouts, enforce caps (`cashbackStatusEnum`), and roll results into the ledger snapshot.
- **Ledger consistency concerns** – Debt ledger updates operate entirely inside the route without transaction-scoped recalculation jobs and never adjust `status` beyond `open` `pages/api/transactions/index.ts:249`. Repayments, overdue detection, and movement reversal flows remain unimplemented.
- **Account balance side-effects** – Account updates are noted as TODOs `pages/api/transactions/index.ts:315`, so posting a transaction does not impact account ledgers/balances yet.

## 3. Phase 1 Implementation Checklist
**Core ingestion pipeline**
- [ ] Introduce a `TransactionEngine` service that encapsulates creation/update/delete side-effects (transaction insert, movement routing, audit logging) and is invoked from API routes instead of inline logic.
- [ ] Normalise transaction type handling across API, logic layer, and UI helpers (shared enum adapter + validation).
- [ ] Emit `transaction_history` rows on every engine mutation, including debt deltas, cashback payouts, and status changes.

**Debt module**
- [ ] Build a dedicated debt movement writer (`createDebtMovement`, `settleDebtMovement`) that validates type + amount, assigns cycle tags, and ensures Drizzle operations run atomically.
- [ ] Implement ledger recalculation helpers to recompute `initialDebt`, `newDebt`, `repayments`, `debtDiscount`, `netDebt`, and derive lifecycle status (`open`, `partial`, `repaid`, `overdue`) based on outstanding balance and business rules.
- [ ] Provide reversal/adjustment handling (movement status transitions, compensating entries) and ensure deletes cascade through the debt engine instead of ad-hoc SQL.

**Cashback module**
- [ ] Create cashback movement generator honoring rule inputs (percent vs fixed), budget caps, and status transitions (`init` → `applied`/`exceed_cap`/`invalidated`).
- [ ] Implement `cashback_ledger` upsert logic that aggregates movements per `(accountId, cycleTag)` and refreshes eligibility + remaining budget.
- [ ] Add recompute/backfill jobs to replay movements and resync ledger totals after rule edits.

**Multi-ledger orchestration**
- [ ] Wire linked transaction workflows (group creation, membership updates, status flips) so multi-step events have deterministic grouping IDs.
- [ ] Ensure debt/cashback modules publish events or hooks usable by account balance updates, notifications, and UI refreshes.
- [ ] Add validation matrix: transaction types → allowed ledger side-effects (e.g., `debt` must carry `personId`, `cashback` requires reward definition, `repayment` should lower debt).

**Testing & ops**
- [ ] Provide integration tests covering transaction creation with debt + cashback branches, ledger recomputation idempotency, and linked transaction flows.
- [ ] Seed fixtures for accounts, people, shops, and ledger tables to exercise multi-ledger logic in CI.
- [ ] Document operational playbooks (backfill scripts, ledger audit queries) before enabling the engine in production.

## 4. Schema & Mapping Reference
| Entity | Key Columns / Enums | Phase 1 Notes |
| --- | --- | --- |
| `transactions` `src/db/schema/transactions.ts:25` | `type` (`expense`, `income`, `debt`, `repayment`, `cashback`, `subscription`, `import`, `adjustment`), `status`, `linkedTxnId`, `occurredOn`, `amount` | Driving record that fans out to debt/cashback/account ledgers. `linkedTxnId` must be populated for multi-step flows. |
| `linked_transactions` `src/db/schema/transactions.ts:156` | `type` (`refund`, `split`, `batch`, `settle`), `relatedTxnIds[]`, `status` | Orchestration anchor for grouped events; needs lifecycle hooks when child movements settle. |
| `debt_movements` `src/db/schema/debtMovements.ts:1` | `movementType` (`borrow`, `repay`, `adjust`, `discount`, `split`), `status`, `amount`, `cycleTag` | Single source for debt audit; active movements feed ledger and history. |
| `debt_ledger` `src/db/schema/debtLedger.ts:1` | Aggregates (`initialDebt`, `newDebt`, `repayments`, `debtDiscount`, `netDebt`), `status`, `cycleTag` | Recomputed from movements; Phase 1 must keep in sync with movement status changes. |
| `cashback_movements` `src/db/schema/cashbackMovements.ts:1` | `cashbackType` (`percent`, `fixed`), `cashbackAmount`, `status`, `budgetCap`, `cycleTag` | Needs creation + validation logic when cashback transactions post. |
| `cashback_ledger` `src/db/schema/cashbackLedger.ts:1` | `totalSpend`, `totalCashback`, `budgetCap`, `eligibility`, `remainingBudget`, `status` | Upsert target after each cashback mutation; drives UI budget states. |
| `transaction_history` `src/db/schema/transactionHistory.ts:1` | Records `old/new` amount, cashback, debt, `actionType` (`update`, `delete`, `cashback_update`) | Ensure engine populates per mutation for full audit trail. |

**Type → Ledger expectations (Phase 1)**
- `debt` → requires debt movement + ledger update with `movementType = 'borrow'`.
- `repayment` → debt movement `movementType = 'repay'`, ledger net debt decrease, potential status bump to `repaid`.
- `cashback` → cashback movement generation, ledger accrual, optional debt credit linkage when used as discount.
- `adjustment` → maps to either debt `adjust` movement or cashback `invalidated` flow depending on payload; engine should enforce rule sets.

## 5. Migration Notes & Risks
- **Service extraction** – Move business logic out of API routes into reusable modules to avoid duplicated SQL and to support background jobs. Confirm the new service layer can run both within Next.js routes and CLI scripts.
- **Backfill strategy** – Before enabling real-time engines, prepare scripts to backfill existing transactions into debt/cashback movements and ledgers to guarantee historical consistency.
- **Concurrency & locking** – Ledger recalculations should run inside database transactions with sensible locking (`FOR UPDATE` or advisory locks) to prevent race conditions when multiple transactions post to the same account/person.
- **Enum harmonisation** – Align UI filters, import mappers, and APIs to the Drizzle enums to prevent silent drops. Introduce a shared constants module exported from the schema package.
- **Testing coverage** – Add regression tests for critical flows (debt repayment bringing balance to zero, cashback cap enforcement) prior to Phase 1 rollout to catch drift early.

