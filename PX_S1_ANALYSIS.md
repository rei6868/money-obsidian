# PX-S1 Initial Analysis Report

## 1. Data Schema Summary & Migration Mapping (Old → New)

The data schema has evolved from a simpler model in "money-new" to a more robust, ledger-based architecture. The core principle is to separate the main `transactions` table from the business-specific "movement" and "ledger" tables. This allows for more scalable and auditable tracking of different financial activities.

### Key Schema Changes:

*   **Introduction of Ledgers:** The most significant change is the introduction of `debt_ledger` and `cashback_ledger`. These tables act as pre-aggregated summaries of their corresponding `_movements` tables. This is a classic data warehousing technique to speed up queries for reporting and dashboards.
*   **Movement Tables:** `debt_movements` and `cashback_movements` are new tables that act as immutable logs of all events related to debt and cashback. This provides a clear audit trail.
*   **Linked Transactions:** The `linked_transactions` table is a new addition to handle complex, multi-leg transactions like refunds, splits, and batch operations. This avoids cluttering the main `transactions` table with workflow-specific state.
*   **Transactions Table Refactoring:** The `transactions` table is now more of a central hub, linking to various other tables via foreign keys (`accountId`, `personId`, `shopId`, `categoryId`, `subscriptionMemberId`, `linkedTxnId`). It holds the core financial event data, but the detailed business logic is handled in the specialized tables.
*   **Dropped `owner_id` from `accounts`:** The `owner_id` has been dropped from the `accounts` table, which simplifies the model and allows for shared/group accounts. Ownership is now likely managed at the `people` level or through other relationships.

### Migration Mapping (Conceptual):

| Old Concept (in `money-new`/`transactions`) | New Schema Implementation |
| :--- | :--- |
| A simple "debt" flag or type in `transactions` | → `debt_movements` table to log each debt event (borrow, repay).<br>→ `debt_ledger` to store the aggregated outstanding balance per person/cycle. |
| Cashback calculated and stored directly in `transactions` | → `cashback_movements` table to log each cashback event.<br>→ `cashback_ledger` to store the aggregated cashback per account/cycle. |
| Refunds or linked payments handled by complex logic in the application layer | → `linked_transactions` table to group related transactions.<br>→ `transactions.linkedTxnId` to link individual transactions to the group. |
| Single `transactions` table holding all data | → A normalized schema with `transactions` as the central fact table, and `debt_movements`, `cashback_movements`, `linked_transactions` as specialized tables. |

## 2. Business Logic Breakdown

The business logic is now clearly separated into different domains, each with its own set of tables.

*   **Core Transactions:** The `transactions` table is the source of truth for all financial events. It records the "what" (amount, date, account) but not the "why" or the "how" of the business logic.
*   **Debt Management:**
    *   `debt_movements`: This is the event log for all things debt-related. Every time a person borrows money, makes a repayment, or has their debt adjusted, a new row is created here. The `movement_type` (`borrow`, `repay`, `adjust`, `discount`, `split`) drives the logic.
    *   `debt_ledger`: This table provides a snapshot of the current debt situation for each person. It is calculated by aggregating the `debt_movements`. This is used for quick lookups of outstanding balances without having to scan the entire `debt_movements` table.
*   **Cashback Management:**
    *   `cashback_movements`: Similar to `debt_movements`, this is an event log for all cashback earned. It records the transaction, the cashback rule applied (`percent` or `fixed`), and the final cashback amount.
    *   `cashback_ledger`: This table summarizes the cashback activity for each account per cycle (`cycle_tag`). It tracks `total_spend`, `total_cashback`, and `budget_cap`, which is essential for enforcing cashback limits.
*   **Multi-leg Workflows:**
    *   `linked_transactions`: This table is the orchestrator for complex workflows. It groups multiple transactions together under a single `linkedTxnId`. The `type` field (`refund`, `split`, `batch`, `settle`) determines the nature of the workflow. This is crucial for maintaining data integrity in scenarios like order cancellations where a payment and a refund need to be linked.

## 3. Checklist for Migration & Refactor

This checklist outlines the necessary steps to build and refactor the routes and logic modules for the new Transaction Engine.

### Phase 1: Schema and Data Layer

*   [ ] **Verify Schema:** Ensure all new tables (`debt_ledger`, `debt_movements`, `cashback_ledger`, `cashback_movements`, `linked_transactions`) are correctly implemented in the database. The Drizzle migration files seem to cover this, but a final check is needed.
*   [ ] **Create Drizzle Schema Files:** The `drizzle/schemas` directory is empty. Create TypeScript schema files for all tables to be used by Drizzle ORM.
*   [ ] **Refactor Existing API Endpoints:**
    *   `api/accounts`: Update to reflect the removal of `owner_id`.
    *   `api/transactions`: This will be the most complex part. The `GET` endpoint needs to be refactored to join with the new tables to provide a comprehensive view of each transaction. The `POST` endpoint will become the entry point for the new Transaction Engine.

### Phase 2: Transaction Engine Logic

*   [ ] **Implement `transactionsLogic.js`:**
    *   Create a `createTransaction` function that acts as the main entry point for the Transaction Engine.
    *   This function should take a transaction payload and determine which sub-ledgers (debt, cashback) need to be updated.
    *   It should create the main transaction record in the `transactions` table.
    *   It should then call the specific logic modules for debt and cashback.
*   [ ] **Implement `debtLedgerLogic.js`:**
    *   Create functions to handle `borrow`, `repay`, `adjust` events.
    *   These functions will create entries in `debt_movements`.
    *   Implement a function to update the `debt_ledger` based on the new movements. This could be triggered after every movement or as a batch job.
*   [ ] **Implement `cashbackLedgerLogic.js`:**
    *   Create a function to process a transaction and calculate cashback based on predefined rules (which need to be stored somewhere, in a new `cashback_rules` table).
    *   This function will create an entry in `cashback_movements`.
    *   Implement a function to update the `cashback_ledger` to reflect the new cashback awarded and check against the `budget_cap`.
*   [ ] **Implement `linkedTxnLogic.js`:**
    *   Create functions to handle `refund`, `split`, and other multi-leg workflows.
    *   These functions will create a `linked_transactions` record and then create the individual transactions, linking them via `linkedTxnId`.

### Phase 3: API Routes

*   [ ] **Refactor `POST /api/transactions`:** This route should now call the `createTransaction` function in `transactionsLogic.js`. It should be able to handle complex payloads that might trigger debt or cashback logic.
*   [ ] **Create `POST /api/linked-txn`:** This new route will handle the creation of linked transactions (refunds, splits). It will call the functions in `linkedTxnLogic.js`.
*   [ ] **Create/Update Ledger Routes:**
    *   `GET /api/debt-ledger`: Create a route to get the debt ledger for a person.
    *   `GET /api/cashback-ledger`: Create a route to get the cashback ledger for an account.

### Phase 4: Testing and Validation

*   [ ] **Unit Tests:** Write unit tests for each logic module (`transactionsLogic`, `debtLedgerLogic`, `cashbackLedgerLogic`, `linkedTxnLogic`).
*   [ ] **Integration Tests:** Write integration tests for the API routes to ensure the end-to-end workflows are working correctly.
*   [ ] **Data Integrity Checks:** Manually verify that the ledger tables are being updated correctly and that the data is consistent across all related tables.
