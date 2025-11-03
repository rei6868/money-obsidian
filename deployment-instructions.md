# Backend Deployment to Neon DB

This document outlines the steps to deploy the backend schema to a Neon DB production or staging environment using Drizzle Kit.

## Prerequisites

1.  **Node.js and npm/pnpm:** Ensure Node.js (LTS recommended) and a package manager (npm or pnpm) are installed.
2.  **Project Dependencies:** Install all project dependencies by running `pnpm install` or `npm install` in the project root.
3.  **Neon Database:** Have an active Neon database instance (production or staging) ready.
4.  **DB_URL Environment Variable:** Set the `DB_URL` environment variable with the connection string to your Neon database. This can be done in a `.env` file in the project root or directly in your deployment environment.

    Example `.env` entry:
    ```
    DB_URL="postgresql://user:password@ep-some-long-id.ap-southeast-1.aws.neon.tech/dbname?sslmode=require"
    ```

## Deployment Steps

1.  **Navigate to Project Root:** Open your terminal and navigate to the root directory of the `money-obsidian` project.

2.  **Run Deployment Script:** Execute the deployment script using pnpm or npm:

    ```bash
    pnpm ts-node scripts/deployNeon.ts
    # or
    npm run ts-node scripts/deployNeon.ts
    ```

    This script will:
    *   Verify the `DB_URL` environment variable.
    *   Locate the `drizzle-kit` binary.
    *   Execute `drizzle-kit push --config drizzle.config.ts` to apply schema changes to the connected Neon database.
    *   Log all output to the console and to a timestamped log file in the `logs/` directory (e.g., `logs/neon-deploy-YYYY-MM-DDTHH-MM-SS-sssZ.log`).

3.  **Verify Deployment:**
    *   Check the terminal output for `✅ Deployment completed successfully.`
    *   Review the generated log file in the `logs/` directory for detailed deployment information and any potential warnings or errors.
    *   (Optional) Connect to your Neon database using a client tool and verify that the database schema reflects the latest changes.

## Troubleshooting

*   **`Missing DB_URL environment variable`**: Ensure `DB_URL` is correctly set in your `.env` file or deployment environment.
*   **`Unable to locate drizzle-kit binary`**: Run `pnpm install` or `npm install` to ensure all project dependencies, including `drizzle-kit`, are installed.
*   **Deployment exited with a non-zero code**: Review the terminal output and the log file (`logs/neon-deploy-*.log`) for specific error messages from Drizzle Kit. This usually indicates a schema mismatch or an issue with the database connection.
