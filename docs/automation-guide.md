
# Automation Guide

This document provides an overview of the automation features, including scheduled jobs and manual job execution.

## Scheduled Jobs

The following jobs are scheduled to run automatically:

- **Daily Balance Reconciliation:** Runs at midnight every day to reconcile account balances.
- **Monthly Report Generation:** Runs at 1 AM on the first day of every month to generate summary reports.
- **Ledger Auditing:** Runs at 2 AM every Sunday to audit and fix inconsistencies in the debt and cashback ledgers.

## Manual Job Execution

Jobs can be triggered manually via the API or the command line.

### API Endpoint

You can trigger a job by sending a POST request to the `/api/automation/run-job` endpoint.

**Request Body:**

```json
{
  "jobName": "reconcile-balances"
}
```

**Available Jobs:**

- `reconcile-balances`
- `generate-reports`
- `audit-ledgers`

### Command Line

You can run a job from the command line using the `runJobs.ts` script.

**Usage:**

```bash
node scripts/runJobs.ts <jobName>
```

**Example:**

```bash
node scripts/runJobs.ts reconcile-balances
```

## Failure Handling and Recovery

If a job fails, it will be logged to the console. The system does not currently have an automatic recovery process. To re-run a failed job, you can trigger it manually via the API or the command line.
