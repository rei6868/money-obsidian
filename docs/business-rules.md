# Business Rules Documentation

## Overview
This document outlines the business rules for the Money Obsidian Ledger API, focusing on reconciliation, automation, and administrative controls.

## Reconciliation Rules

### Auto-Matching Credits/Debits
- **Purpose**: Automatically match available credits (cashback) with outstanding debts
- **Logic**:
  - Find all open debts in the debt ledger
  - Find all open cashback entries with positive balances
  - Match debts with cashback where person/account IDs align (simplified matching)
  - Apply the minimum of debt amount and cashback amount as the match
  - Update both ledgers accordingly
- **Frequency**: Runs nightly as part of reconciliation job
- **Status Update**: Debt status changes to 'repaid' if net debt becomes 0

### Closing Debts at Period End
- **Purpose**: Close out debt cycles at the end of billing periods
- **Logic**:
  - Identify open debts past the period end date
  - Set status to 'repaid' if netDebt = 0, otherwise 'overdue'
  - Update lastUpdated timestamp
- **Period Support**: Monthly and yearly cycles
- **Frequency**: Runs nightly as part of reconciliation job

### Closing Cashbacks at Period End
- **Purpose**: Finalize cashback cycles at period boundaries
- **Logic**:
  - Identify open cashback entries past the period end date
  - Set status to 'closed'
  - Update lastUpdated timestamp
- **Period Support**: Monthly and yearly cycles
- **Frequency**: Runs nightly as part of reconciliation job

### Validation Rules
- **Negative Debt Check**: Ensures no debts have negative net debt
- **Budget Cap Check**: Ensures cashback doesn't exceed configured budget caps
- **Transaction Consistency**: Verifies all active transactions have corresponding ledger movements

## Scheduled Jobs

### Nightly Reconciliation (2 AM Daily)
- Runs auto-matching, debt/cashback closure, and validation
- Logs results and any validation errors
- Critical for maintaining ledger accuracy

### Data Cleanup (3 AM Weekly - Sunday)
- Removes void/canceled transactions older than 6 months
- Removes reversed debt movements older than 1 year
- Removes invalidated cashback movements older than 1 year
- Helps maintain database performance

### Scheduled Reporting
- **Weekly Reports** (4 AM Monday): Generates account balances, category summaries, top expenses, trends, and forecasts
- **Monthly Reports** (5 AM 1st of month): Comprehensive monthly analytics with extended data
- Saves reports to `/reports/` directory as JSON files

### Cache Refresh (Every 6 hours)
- Updates lastUpdated timestamps on active ledger entries
- Maintains cache freshness for performance
- Extensible for additional cache management

## Administrative Endpoints

### Manual Reconciliation (`POST /api/admin/reconcile`)
- **Actions**:
  - `autoMatch`: Trigger credit/debit matching
  - `closeDebts`: Close debts for specified period
  - `closeCashbacks`: Close cashbacks for specified period
  - `validate`: Run validation checks
- **Parameters**: `action`, `period` (optional)
- **Security**: Should be protected with authentication

### Job Triggers (`POST /api/admin/trigger-job`)
- **Job Types**:
  - `reconciliation`: Run nightly reconciliation
  - `cleanup`: Run data cleanup
  - `weekly-report`: Generate weekly report
  - `monthly-report`: Generate monthly report
  - `cache-refresh`: Refresh caches
- **Response**: Job execution result and timestamp
- **Security**: Should be protected with authentication

### Audit Logs (`GET /api/admin/audit`)
- **Audit Types**:
  - `transactions`: Transaction history with status changes
  - `debt-movements`: Debt movement audit trail
  - `cashback-movements`: Cashback movement audit trail
  - `job-history`: Scheduled job execution history
- **Parameters**: `type`, `limit`, `offset`, `startDate`, `endDate`
- **Security**: Should be protected with authentication

## Manual Override Capabilities

### Reconciliation Overrides
- Admin can manually trigger reconciliation processes
- Supports partial reconciliation (specific periods or rules)
- Validation can be run on-demand for immediate feedback

### Job Management
- All scheduled jobs can be triggered manually
- Useful for testing, catch-up, or urgent processing
- Job history provides audit trail for manual executions

### Audit Trail
- Comprehensive logging of all reconciliation actions
- Transaction and movement history with timestamps
- Job execution tracking for operational monitoring

## Error Handling and Monitoring

### Validation Failures
- Reconciliation validation failures are logged
- Admin endpoints return detailed error information
- Jobs continue processing even with individual failures

### Job Monitoring
- All jobs log start/completion status
- Errors are captured and logged
- Audit endpoints provide visibility into job history

### Data Integrity
- Transactions ensure atomicity of ledger updates
- Validation rules prevent inconsistent states
- Rollback capabilities for error recovery

## Future Enhancements

### Advanced Matching
- More sophisticated credit/debit matching algorithms
- Priority-based matching rules
- Multi-currency support

### Enhanced Automation
- Configurable job schedules
- Conditional job execution based on data thresholds
- Integration with external notification systems

### Advanced Auditing
- Real-time audit streaming
- Advanced filtering and search capabilities
- Integration with external logging/monitoring systems
