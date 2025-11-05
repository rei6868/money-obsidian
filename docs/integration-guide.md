# Integration Guide

This document outlines the integration interfaces and automation endpoints for various external tools and workflows.

## Table of Contents
- [Obsidian Sync Integration](#obsidian-sync-integration)
- [Excel Report Integration](#excel-report-integration)
- [External System Integration](#external-system-integration)
- [Automation Endpoints](#automation-endpoints)
    - [Scheduled Jobs](#scheduled-jobs)
    - [Batch Imports](#batch-imports)
    - [Export Tools](#export-tools)

---

## Obsidian Sync Integration

### Overview
This integration allows for synchronization of transaction data from Obsidian notes into the Money Obsidian system. It supports both creating new transactions and updating existing ones based on `transactionId`.

### API Endpoints
- **Endpoint**: Synchronize Transactions
    - **Method**: `POST`
    - **Path**: `/api/integrations/obsidian/sync`
    - **Payload Example**:
        ```json
        {
            "transactions": [
                {
                    "transactionId": "optional-uuid-for-update",
                    "description": "Groceries from SuperMart",
                    "amount": -55.75,
                    "type": "expense",
                    "accountId": "account-uuid-123",
                    "category": "Food",
                    "createdAt": "2025-10-26T10:00:00Z"
                },
                {
                    "description": "Freelance Payment",
                    "amount": 500.00,
                    "type": "income",
                    "accountId": "account-uuid-456",
                    "category": "Work",
                    "createdAt": "2025-10-27T15:30:00Z"
                }
            ]
        }
        ```
    - **Response Example (Success)**:
        ```json
        {
            "status": "success",
            "message": "Obsidian sync processed.",
            "results": [
                {
                    "id": "transaction-uuid-1",
                    "status": "updated",
                    "data": { /* updated transaction object */ }
                },
                {
                    "id": "transaction-uuid-2",
                    "status": "created",
                    "data": { /* new transaction object */ }
                }
            ]
        }
        ```
    - **Response Example (Error)**:
        ```json
        {
            "status": "error",
            "message": "Invalid payload: transactions array expected."
        }
        ```

### Test Cases
- **Test Case 1: Create New Transaction**
    - **Description**: Send a payload with a new transaction (no `transactionId`).
    - **Expected Result**: A new transaction is created in the database, and the response indicates `status: "created"`.
- **Test Case 2: Update Existing Transaction**
    - **Description**: Send a payload with an existing `transactionId` and updated fields.
    - **Expected Result**: The existing transaction is updated in the database, and the response indicates `status: "updated"`.
- **Test Case 3: Mixed Payload (Create & Update)**
    - **Description**: Send a payload containing both new transactions and updates to existing ones.
    - **Expected Result**: All transactions are processed correctly, with appropriate `status` for each.
- **Test Case 4: Invalid Payload**
    - **Description**: Send a non-array payload for `transactions`.
    - **Expected Result**: API returns `400 Bad Request` with an error message.

---

## Excel Report Integration

### Overview
This integration provides an endpoint to generate and download an Excel report of transactions within a specified date range.

### API Endpoints
- **Endpoint**: Generate Transactions Report
    - **Method**: `GET`
    - **Path**: `/api/integrations/excel/report`
    - **Query Parameters**:
        - `startDate` (required): `YYYY-MM-DD` - The start date for the report.
        - `endDate` (required): `YYYY-MM-DD` - The end date for the report.
    - **Response**: A downloadable Excel file (`.xlsx`) containing transaction data.
    - **Error Response (400 Bad Request)**:
        ```json
        {
            "status": "error",
            "message": "Missing or invalid startDate or endDate query parameters."
        }
        ```

### Test Cases
- **Test Case 1: Valid Date Range**
    - **Description**: Request a report with valid `startDate` and `endDate` parameters.
    - **Expected Result**: An Excel file is downloaded containing transactions within the specified range.
- **Test Case 2: Missing Parameters**
    - **Description**: Request a report without `startDate` or `endDate`.
    - **Expected Result**: API returns `400 Bad Request` with an error message.
- **Test Case 3: No Transactions in Range**
    - **Description**: Request a report for a date range with no transactions.
    - **Expected Result**: An Excel file is downloaded with only headers and no data rows.

---

## External System Integration

### Overview
This endpoint provides a generic webhook interface for external systems to send event data to Money Obsidian. The system will acknowledge receipt of the payload. Further processing would be implemented based on the `event` type.

### API Endpoints
- **Endpoint**: External Webhook Receiver
    - **Method**: `POST`
    - **Path**: `/api/integrations/external/webhook`
    - **Payload Example**:
        ```json
        {
            "event": "transaction_created",
            "timestamp": "2025-10-28T11:00:00Z",
            "data": {
                "externalId": "ext-txn-abc-123",
                "description": "Online Purchase",
                "amount": -29.99,
                "currency": "USD"
            }
        }
        ```
    - **Response Example (Success)**:
        ```json
        {
            "status": "received",
            "id": "webhook-1700000000000"
        }
        ```
    - **Error Response (405 Method Not Allowed)**:
        ```json
        {
            "message": "Method GET Not Allowed"
        }
        ```

### Test Cases
- **Test Case 1: Valid Webhook Payload**
    - **Description**: Send a `POST` request with a well-formed JSON payload.
    - **Expected Result**: API returns `200 OK` with `status: "received"` and a generated `id`.
- **Test Case 2: Invalid Method**
    - **Description**: Send a `GET` request to the webhook endpoint.
    - **Expected Result**: API returns `405 Method Not Allowed`.

---

## Automation Endpoints

### Scheduled Jobs

#### Overview
Scheduled jobs are automated scripts that run at predefined intervals (e.g., daily, weekly) to perform routine tasks. An example is the `daily-summary.ts` script, which generates a summary of transactions for the previous day.

#### Example: Daily Summary Script
- **Script Path**: `scripts/automation/daily-summary.ts`
- **Description**: This script connects to the database, fetches all transactions from the previous day, and calculates total income, expenses, and net change. The results are logged to the console.
- **Usage**: This script is designed to be run as a cron job or similar scheduled task on the server.
    ```bash
    # Example cron job entry (runs daily at 1 AM)
    0 1 * * * /usr/bin/env ts-node /path/to/money-obsidian/scripts/automation/daily-summary.ts >> /var/log/money-obsidian-daily-summary.log 2>&1
    ```
    *Note: `ts-node` must be installed globally or available in the execution environment.*
- **Output Example**:
    ```
    Starting daily summary generation...
    --- Daily Summary for 2025-10-29 ---
    Total Income: 3000.00
    Total Expenses: -54.50
    Net Change: 2945.50
    Number of transactions: 3
    ------------------------------------
    Daily summary generation finished.
    ```

#### Test Cases
- **Test Case 1: Run Script Manually**
    - **Description**: Execute the `daily-summary.ts` script directly from the command line.
    - **Expected Result**: The script runs without errors and prints a daily summary to the console.
- **Test Case 2: No Transactions for the Day**
    - **Description**: Run the script when there are no transactions recorded for the previous day.
    - **Expected Result**: The script runs without errors, and the summary shows 0 for income, expenses, and net change.

### Batch Imports

#### Overview
This endpoint allows for importing multiple transactions into the system using either JSON or CSV formats. It leverages the existing transaction creation logic.

#### API Endpoints
- **Endpoint**: Batch Import Transactions
    - **Method**: `POST`
    - **Path**: `/api/integrations/batch-import`
    - **Payload Example (JSON)**:
        ```json
        {
            "type": "json",
            "payload": [
                {
                    "description": "Coffee",
                    "amount": -4.50,
                    "type": "expense",
                    "accountId": "account-uuid-123",
                    "category": "Food & Drink",
                    "createdAt": "2025-10-29T08:00:00Z"
                },
                {
                    "description": "Salary",
                    "amount": 3000.00,
                    "type": "income",
                    "accountId": "account-uuid-456",
                    "category": "Work",
                    "createdAt": "2025-10-29T17:00:00Z"
                }
            ]
        }
        ```
    - **Payload Example (CSV)**:
        ```json
        {
            "type": "csv",
            "payload": "description,amount,type,accountId,category,createdAt\nCoffee,-4.50,expense,account-uuid-123,Food & Drink,2025-10-29T08:00:00Z\nSalary,3000.00,income,account-uuid-456,Work,2025-10-29T17:00:00Z"
        }
        ```
    - **Response Example (Success)**:
        ```json
        {
            "status": "success",
            "message": "Batch import processed.",
            "results": [
                {
                    "id": "transaction-uuid-1",
                    "status": "created",
                    "data": { /* new transaction object */ }
                },
                {
                    "id": "transaction-uuid-2",
                    "status": "created",
                    "data": { /* new transaction object */ }
                }
            ]
        }
        ```
    - **Error Response (400 Bad Request)**:
        ```json
        {
            "status": "error",
            "message": "Missing type or payload in request body."
        }
        ```

#### Test Cases
- **Test Case 1: Valid JSON Import**
    - **Description**: Send a `POST` request with `type: "json"` and an array of valid transaction objects.
    - **Expected Result**: All transactions are created, and the response indicates `status: "created"` for each.
- **Test Case 2: Valid CSV Import**
    - **Description**: Send a `POST` request with `type: "csv"` and a CSV string of valid transaction data.
    - **Expected Result**: All transactions are created, and the response indicates `status: "created"` for each.
- **Test Case 3: Invalid Type**
    - **Description**: Send a `POST` request with an unsupported `type` (e.g., "xml").
    - **Expected Result**: API returns `400 Bad Request` with an error message.
- **Test Case 4: Missing Payload**
    - **Description**: Send a `POST` request without the `payload` field.
    - **Expected Result**: API returns `400 Bad Request` with an error message.

### Export Tools
#### Overview
The Excel Report Integration serves as an example of an export tool. Additional export tools could be developed for other formats (e.g., PDF, JSON export of all data).
