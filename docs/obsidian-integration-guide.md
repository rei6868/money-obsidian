
# Obsidian Integration Guide

This guide outlines the integration of Money Obsidian with backend APIs, enabling a seamless workflow for managing financial data directly within Obsidian.

## 1. Backend API Endpoints

The following backend API endpoints are available for integration:

- **Transactions:**
  - `POST /api/transactions`: Add a new transaction.
  - `GET /api/transactions/{id}`: Retrieve a specific transaction.
- **Debt Ledger:**
  - `GET /api/debt-ledger`: Get a list of debt ledgers.
  - `GET /api/debt-ledger/{personId}`: Get debt balance for a person.
- **Cashback Ledger:**
  - `GET /api/cashback-ledger`: Get a list of cashback ledgers.
  - `GET /api/cashback-ledger/{accountId}`: Get cashback balance for an account.
- **Reporting:**
  - `GET /api/reports/account-summary`: Get account summaries.
  - `GET /api/reports/category-summary`: Get category spending summaries.
  - `GET /api/reports/movement-history`: Get transaction movement history.
  - `GET /api/reports/analytics`: Get analytics data.
- **Automation:**
  - `POST /api/automation/run-job`: Manually trigger a scheduled job.

## 2. Obsidian Workflow Integration

### Markdown Note Schema

We recommend using a consistent Markdown note schema for transactions and reports to facilitate Dataview queries and plugin interactions.

**Transaction Note Example (`obsidian/templates/transaction-template.md`):**

```markdown
---
type: transaction
date: {{date}}
amount: 
category: 
account: 
notes: 
---

# Transaction on {{date}}

Amount: 
Category: 
Account: 
Notes: 
```

### Dataview Queries

Dataview can be used to display and summarize financial data within Obsidian notes.

**Daily Transactions Example (`obsidian/dataview-queries/daily-transactions.md`):**

```dataview
TABLE amount, category, account, notes
FROM "transactions"
WHERE date = this.file.day
SORT date DESC
```

### Obsidian Plugin Scaffold

A basic plugin scaffold is provided to demonstrate how to interact with the backend APIs from within Obsidian.

- `obsidian/main.ts`: Main plugin file with example API calls.
- `obsidian/manifest.json`: Plugin manifest.

## 3. API Automation

Example scripts are provided to demonstrate how to interact with the backend APIs for tasks like adding transactions and running reports.

**Example (`obsidian/scripts/api-automation.js`):**

```javascript
// See obsidian/scripts/api-automation.js for full content
const addTransaction = async (transactionData) => { /* ... */ };
const runReport = async (reportType, startDate, endDate) => { /* ... */ };
```

## 4. Simulator: Test Scripts

A test script is available to simulate pushing and pulling transaction data between Obsidian and the backend API.

- `test/test-obsidian-api.js`: Contains example tests for `addTransaction` and `runReport`.

## 5. Recommended Integration Architecture

For a robust integration, consider the following architecture:

- **Obsidian Plugin:** Develop a dedicated Obsidian plugin to handle API interactions, data synchronization, and UI elements for financial management.
- **Backend API:** The existing backend API serves as the single source of truth for financial data.
- **Dataview:** Utilize Dataview for flexible data display and querying within Obsidian.
- **Markdown Notes:** Store financial records as structured Markdown notes, enabling easy human readability and version control.
- **Automation Scripts:** Implement automation scripts for recurring tasks, such as daily balance reconciliation or report generation.

This architecture ensures data consistency, provides a flexible user interface, and leverages Obsidian's powerful knowledge management capabilities.
