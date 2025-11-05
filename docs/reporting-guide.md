# Reporting Guide

This guide provides an overview of the reporting capabilities of the Money Obsidian API.

## Endpoints

The following endpoints are available for reporting:

- `GET /reports/account-summary`: Provides a summary of account balances and movements.
- `GET /reports/category-summary`: Provides a summary of spending by category.
- `GET /reports/debt-cashback-summary`: Provides a summary of debt and cashback movements.

## Use Cases

### Account Summary

To get a summary of an account, you can use the `/reports/account-summary` endpoint. You can filter the summary by account ID and date range.

**Example Query:**

```
GET /reports/account-summary?accountId=...&fromDate=2025-01-01&toDate=2025-01-31
```

### Category Summary

To get a summary of spending by category, you can use the `/reports/category-summary` endpoint. You can filter the summary by category ID and date range.

**Example Query:**

```
GET /reports/category-summary?categoryId=...&fromDate=2025-01-01&toDate=2025-01-31
```

### Debt and Cashback Summary

To get a summary of debt and cashback movements, you can use the `/reports/debt-cashback-summary` endpoint. You can filter the summary by person ID and date range.

**Example Query:**

```
GET /reports/debt-cashback-summary?personId=...&fromDate=2025-01-01&toDate=2025-01-31
```

## Limitations

Currently, there are no known limitations.
