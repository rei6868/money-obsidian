# PX-P2-cross-ledger-logic: Cross-Boundary Processing and Ledger Management

This document outlines the changes implemented to enable cross-boundary processing for transactions and to provide `PUT`/`DELETE` endpoints for `debt_ledger` and `cashback_ledger`. It also covers the strict foreign key validation added to the transaction creation process.

## 1. Refactor API Logic to Enable Cross-Boundary Processing

The transaction creation API (`pages/api/transactions/index.ts`) has been refactored to automatically update related ledgers (debt, cashback, movements) as specified by business logic. A new service, `updateLedgersOnTransaction`, has been introduced in `lib/logic/crossLedgerLogic.ts` to encapsulate this multi-ledger processing.

### `lib/logic/crossLedgerLogic.ts`

This file now contains the logic for updating debt ledgers and debt movements based on transaction data.

**Key Changes:**

*   **`updateLedgersOnTransaction(transaction: any, body: any)` function:**
    *   Takes the created transaction and the request body as input.
    *   Handles the creation and updating of `debt_ledger` entries.
    *   Creates new `debt_movements` entries.
    *   Includes validation for `movementType`.
    *   Placeholder for cashback ledger update logic (to be implemented).

### `pages/api/transactions/index.ts`

The `POST` endpoint in this file now calls the `updateLedgersOnTransaction` service after a transaction is successfully created.

**Key Changes:**

*   Imported `updateLedgersOnTransaction` from `../../../lib/logic/crossLedgerLogic`.
*   Removed the inline debt logic and replaced it with a call to `await updateLedgersOnTransaction(createdTxn, body);`.

## 2. Implement PUT/DELETE Endpoints for `debt_ledger` and `cashback_ledger`

New API endpoints have been created to allow updating and deleting individual `debt_ledger` and `cashback_ledger` entries by their ID.

### `pages/api/debt-ledger/[id].ts`

This file handles `PUT` and `DELETE` requests for `debt_ledger` entries.

**Endpoints:**

*   **`PUT /api/debt-ledger/[id]`**: Updates a `debt_ledger` entry.
    *   **Request Body**: Partial `DebtLedger` object with fields to update.
    *   **Response**: `200 OK` with the updated `DebtLedger` object, or `404 Not Found` if the ID does not exist.
*   **`DELETE /api/debt-ledger/[id]`**: Deletes a `debt_ledger` entry.
    *   **Response**: `200 OK` with a success message, or `404 Not Found` if the ID does not exist.

### `pages/api/cashback-ledger/[id].ts`

This file handles `PUT` and `DELETE` requests for `cashback_ledger` entries.

**Endpoints:**

*   **`PUT /api/cashback-ledger/[id]`**: Updates a `cashback_ledger` entry.
    *   **Request Body**: Partial `CashbackLedger` object with fields to update.
    *   **Response**: `200 OK` with the updated `CashbackLedger` object, or `404 Not Found` if the ID does not exist.
*   **`DELETE /api/cashback-ledger/[id]`**: Deletes a `cashback_ledger` entry.
    *   **Response**: `200 OK` with a success message, or `404 Not Found` if the ID does not exist.

## 3. Strictly Validate All Foreign Keys

Strict validation has been added to the `POST` endpoint in `pages/api/transactions/index.ts` to ensure that `accountId` and `personId` (if provided) refer to existing records in their respective tables.

**Key Changes in `pages/api/transactions/index.ts` (POST handler):**

*   **`accountId` Validation**: Before creating a transaction, the `accountId` from the request body is checked against the `accounts` table. If the account does not exist, a `400 Bad Request` error is returned.
*   **`personId` Validation**: If a `personId` is provided in the request body, it is checked against the `people` table. If the person does not exist, a `400 Bad Request` error is returned.

## 4. Sample Payloads and Error Cases

### Transaction Creation (`POST /api/transactions`)

**Sample Payload:**

```json
{
  "occurredOn": "2025-11-03T10:00:00Z",
  "amount": 100.50,
  "type": "expense",
  "status": "completed",
  "accountId": "existing-account-id",
  "personId": "existing-person-id",
  "notes": "Lunch with a friend",
  "debtMovement": {
    "movementType": "borrow",
    "cycleTag": "2025-11"
  }
}
```

**Error Cases:**

*   **Missing Required Fields**: `400 Bad Request` if `occurredOn`, `amount`, `type`, `status`, or `accountId` are missing.
*   **Invalid `type` or `status`**: `400 Bad Request` if the provided `type` or `status` is not one of the allowed enum values.
*   **Invalid `amount`**: `400 Bad Request` if `amount` is not a valid number.
*   **Invalid `accountId`**: `400 Bad Request` if the `accountId` does not exist in the `accounts` table.
*   **Invalid `personId`**: `400 Bad Request` if the `personId` (when provided) does not exist in the `people` table.
*   **Invalid `debtMovement.movementType`**: `500 Internal Server Error` (currently, this is thrown from `crossLedgerLogic.ts` and caught by the transaction handler).

### Debt Ledger Update (`PUT /api/debt-ledger/[id]`)

**Sample Payload:**

```json
{
  "status": "repaid",
  "notes": "Paid off early"
}
```

**Error Cases:**

*   **Missing `debtLedgerId`**: `400 Bad Request` if the ID is not provided in the URL.
*   **Debt Ledger Not Found**: `404 Not Found` if no `debt_ledger` entry exists with the given ID.
*   **Database Errors**: `500 Internal Server Error` for other database-related issues.

### Debt Ledger Delete (`DELETE /api/debt-ledger/[id]`)

**Error Cases:**

*   **Missing `debtLedgerId`**: `400 Bad Request` if the ID is not provided in the URL.
*   **Debt Ledger Not Found**: `404 Not Found` if no `debt_ledger` entry exists with the given ID.
*   **Database Errors**: `500 Internal Server Error` for other database-related issues.

### Cashback Ledger Update (`PUT /api/cashback-ledger/[id]`)

**Sample Payload:**

```json
{
  "status": "closed",
  "totalCashback": "50.25"
}
```

**Error Cases:**

*   **Missing `cashbackLedgerId`**: `400 Bad Request` if the ID is not provided in the URL.
*   **Cashback Ledger Not Found**: `404 Not Found` if no `cashback_ledger` entry exists with the given ID.
*   **Database Errors**: `500 Internal Server Error` for other database-related issues.

### Cashback Ledger Delete (`DELETE /api/cashback-ledger/[id]`)

**Error Cases:**

*   **Missing `cashbackLedgerId`**: `400 Bad Request` if the ID is not provided in the URL.
*   **Cashback Ledger Not Found**: `404 Not Found` if no `cashback_ledger` entry exists with the given ID.
*   **Database Errors**: `500 Internal Server Error` for other database-related issues.
