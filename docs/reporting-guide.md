# Reporting and Analytics API Guide

This document describes the new reporting and analytics endpoints added to the Money API.

## Overview

The reporting module provides comprehensive financial insights through various endpoints that aggregate and analyze transaction data, account balances, and financial trends.

## Endpoints

### 1. Account Balance Summary
**Endpoint:** `GET /api/reports/account-balance`

**Purpose:** Retrieve account balance summaries with inflow/outflow analysis.

**Query Parameters:**
- `accountId` (optional): Filter by specific account ID
- `startDate` (optional): Start date for filtering (ISO format)
- `endDate` (optional): End date for filtering (ISO format)
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 50)

**Response:**
```json
{
  "data": [
    {
      "accountId": "acc-123",
      "accountName": "Main Checking",
      "currentBalance": 5000.00,
      "totalIn": 10000.00,
      "totalOut": 5000.00,
      "netFlow": 5000.00,
      "period": "2024-01-01 to 2024-12-31"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "totalCount": 5,
    "totalPages": 1
  }
}
```

### 2. Category Summary
**Endpoint:** `GET /api/reports/category-summary`

**Purpose:** Get spending/income summaries grouped by category.

**Query Parameters:**
- `categoryId` (optional): Filter by specific category ID
- `startDate` (optional): Start date for filtering
- `endDate` (optional): End date for filtering
- `groupBy` (optional): 'monthly' or 'yearly' (default: 'monthly')
- `page` (optional): Page number
- `pageSize` (optional): Items per page

**Response:**
```json
{
  "data": [
    {
      "categoryId": "cat-123",
      "categoryName": "Groceries",
      "totalAmount": 2500.00,
      "transactionCount": 25,
      "averageAmount": 100.00,
      "period": "2024-01"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "totalCount": 10,
    "totalPages": 1
  },
  "groupBy": "monthly"
}
```

### 3. Movement History
**Endpoint:** `GET /api/reports/movement-history`

**Purpose:** Retrieve chronological transaction history with filtering.

**Query Parameters:**
- `startDate` (optional): Start date for filtering
- `endDate` (optional): End date for filtering
- `accountId` (optional): Filter by account
- `categoryId` (optional): Filter by category
- `page` (optional): Page number
- `pageSize` (optional): Items per page

**Response:**
```json
{
  "data": [
    {
      "transactionId": "txn-123",
      "occurredOn": "2024-01-15",
      "amount": 150.00,
      "type": "expense",
      "accountName": "Main Checking",
      "categoryName": "Groceries",
      "notes": "Weekly shopping"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "totalCount": 100,
    "totalPages": 2
  }
}
```

### 4. Analytics
**Endpoint:** `GET /api/reports/analytics`

**Purpose:** Access various analytical insights and forecasts.

**Query Parameters:**
- `action`: Required. One of: 'top-expenses', 'recurring-trends', 'forecasts'
- `startDate` (optional): Start date for filtering
- `endDate` (optional): End date for filtering
- `limit` (optional): Number of results to return (default: 10)
- `period` (optional): For forecasts: 'next-month', 'next-quarter', 'next-year'

**Response for top-expenses:**
```json
{
  "action": "top-expenses",
  "data": [
    {
      "categoryName": "Groceries",
      "totalAmount": 2500.00,
      "percentage": 25.0
    }
  ]
}
```

**Response for recurring-trends:**
```json
{
  "action": "recurring-trends",
  "data": [
    {
      "categoryName": "Rent",
      "frequency": "monthly",
      "averageAmount": 1200.00,
      "trend": "stable"
    }
  ]
}
```

**Response for forecasts:**
```json
{
  "action": "forecasts",
  "data": [
    {
      "type": "debt",
      "projectedAmount": 5250.00,
      "confidence": 0.7,
      "period": "next-month"
    },
    {
      "type": "cashback",
      "projectedAmount": 1100.00,
      "confidence": 0.8,
      "period": "next-month"
    }
  ]
}
```

## Error Handling

All endpoints return standard HTTP status codes:
- `200`: Success
- `400`: Bad request (invalid parameters)
- `405`: Method not allowed
- `500`: Internal server error

Error responses include an `error` field with a descriptive message.

## Data Types

- All monetary amounts are in the system's base currency
- Dates are in ISO format (YYYY-MM-DD)
- Percentages are decimal values (0-100)
- Confidence scores are decimal values (0-1)

## Performance Notes

- Endpoints support pagination to handle large datasets
- Database queries are optimized with appropriate indexing
- Complex analytics operations may take longer for large date ranges
- Consider caching results for frequently accessed reports
