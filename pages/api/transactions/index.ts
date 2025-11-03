import type { NextApiRequest, NextApiResponse } from "next";
import { randomUUID } from "crypto";
import { getTransactionsTable } from "../../../lib/api/transactions/transactions.table";
import {
  type TransactionsTableRequest,
  type SortDirection,
} from "../../../lib/api/transactions/transactions.types";
import { db } from "../../../lib/db/client";
import { transactions, transactionTypeEnum, transactionStatusEnum, type NewTransaction } from "../../../src/db/schema/transactions";
import { accounts } from "../../../src/db/schema/accounts";
import { people } from "../../../src/db/schema/people";
import { updateLedgersOnTransaction } from "../../../lib/logic/crossLedgerLogic";
import { eq } from "drizzle-orm";

// Mock data for development when database is not configured
const MOCK_TRANSACTIONS: any[] = [
  {
    transactionId: "mock-txn-1",
    transactionType: "expense",
    amount: 150000,
    transactionDate: new Date().toISOString(),
    accountId: "mock-acc-1",
    accountName: "Vietcombank Savings",
    categoryId: "mock-cat-1",
    categoryName: "Groceries",
    personId: "mock-person-1",
    personName: "John Doe",
    shopId: null,
    shopName: null,
    notes: "Weekly groceries",
    status: "completed",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    transactionId: "mock-txn-2",
    transactionType: "income",
    amount: 5000000,
    transactionDate: new Date().toISOString(),
    accountId: "mock-acc-1",
    accountName: "Vietcombank Savings",
    categoryId: "mock-cat-2",
    categoryName: "Salary",
    personId: "mock-person-1",
    personName: "John Doe",
    shopId: null,
    shopName: null,
    notes: "Monthly salary",
    status: "completed",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const database = db;

  if (!database) {
    console.warn("Database connection is not configured - using mock data");

    if (req.method === "GET") {
      // Return mock transactions with pagination support
      const page = Number(req.query.page) || 1;
      const pageSize = Number(req.query.pageSize) || 50;
      const start = (page - 1) * pageSize;
      const end = start + pageSize;

      const paginatedData = MOCK_TRANSACTIONS.slice(start, end);

      res.status(200).json({
        transactions: paginatedData,
        totalCount: MOCK_TRANSACTIONS.length,
        page,
        pageSize,
        totalPages: Math.ceil(MOCK_TRANSACTIONS.length / pageSize),
      });
      return;
    }

    if (req.method === "POST") {
      const body = req.body || {};
      const newTransaction = {
        transactionId: `mock-txn-${Date.now()}`,
        transactionType: body.transactionType || "expense",
        amount: Number(body.amount || 0),
        transactionDate: body.transactionDate || new Date().toISOString(),
        accountId: body.accountId || "mock-acc-1",
        accountName: "Vietcombank Savings",
        categoryId: body.categoryId || null,
        categoryName: null,
        personId: body.personId || "mock-person-1",
        personName: "John Doe",
        shopId: body.shopId || null,
        shopName: null,
        notes: body.notes || null,
        status: body.status || "completed",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      MOCK_TRANSACTIONS.unshift(newTransaction);
      res.status(201).json(newTransaction);
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (req.method === "GET") {
    try {
      const parseNumericParam = (value: unknown): number | undefined => {
        if (Array.isArray(value)) {
          return parseNumericParam(value[0]);
        }
        if (typeof value === "string" && value.trim() !== "") {
          const parsed = Number.parseInt(value, 10);
          if (Number.isFinite(parsed) && parsed > 0) {
            return parsed;
          }
        }
        return undefined;
      };

      const parseSortDirection = (value: unknown): SortDirection | undefined => {
        if (Array.isArray(value)) {
          return parseSortDirection(value[0]);
        }
        if (value === "asc" || value === "desc") {
          return value;
        }
        return undefined;
      };

      const normalizeString = (value: unknown): string | undefined => {
        if (Array.isArray(value)) {
          return normalizeString(value[0]);
        }
        if (typeof value === "string") {
          const trimmed = value.trim();
          return trimmed === "" ? undefined : trimmed;
        }
        return undefined;
      };

      const requestPayload: TransactionsTableRequest = {};

      const searchTerm = normalizeString(req.query.search);
      if (searchTerm) {
        requestPayload.searchTerm = searchTerm;
      }

      const page = parseNumericParam(req.query.page);
      const pageSize = parseNumericParam(req.query.pageSize);
      if (page || pageSize) {
        requestPayload.pagination = {};
        if (page) {
          requestPayload.pagination.page = page;
        }
        if (pageSize) {
          requestPayload.pagination.pageSize = pageSize;
        }
      }

      const sortBy = normalizeString(req.query.sortBy);
      const sortDir = parseSortDirection(req.query.sortDir);
      if (sortBy || sortDir) {
        requestPayload.sort = {};
        if (sortBy) {
          requestPayload.sort.columnId = sortBy;
        }
        if (sortDir) {
          requestPayload.sort.direction = sortDir;
        }
      }

      const restoreToken = normalizeString(req.query.restore);

      const response = await getTransactionsTable(requestPayload, restoreToken);

      return res.status(200).json(response);
    } catch (error) {
      console.error("Failed to fetch transactions", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      return res.status(500).json({ error: message });
    }
  }

  if (req.method === "POST") {
    try {
      const body = req.body || {};
      // Validate
      const requiredFields = ["occurredOn", "amount", "type", "status", "accountId"];
      const missing = requiredFields.filter(field => body[field] === undefined || body[field] === null);
      if (missing.length > 0) return res.status(400).json({ error: "Missing fields", details: missing });

      // Type check
      const allowedTypes = transactionTypeEnum.enumValues as readonly string[];
      if (!allowedTypes.includes(body.type))
        return res.status(400).json({ error: `type must be one of: ${allowedTypes.join(", ")}` });

      const allowedStatuses = transactionStatusEnum.enumValues as readonly string[];
      if (!allowedStatuses.includes(body.status))
        return res.status(400).json({ error: `status must be one of: ${allowedStatuses.join(", ")}` });

      const amount = parseFloat(body.amount);
      const fee = body.fee ? parseFloat(body.fee) : 0;
      if (isNaN(amount)) return res.status(400).json({ error: "amount must be a valid number" });

      // Validate foreign keys
      const accountExists = await database.select().from(accounts).where(eq(accounts.accountId, body.accountId)).limit(1);
      if (accountExists.length === 0) {
        return res.status(400).json({ error: "Invalid accountId", details: `Account with ID ${body.accountId} does not exist.` });
      }

      if (body.personId) {
        const personExists = await database.select().from(people).where(eq(people.personId, body.personId)).limit(1);
        if (personExists.length === 0) {
          return res.status(400).json({ error: "Invalid personId", details: `Person with ID ${body.personId} does not exist.` });
        }
      }

      // Create Transaction
      const transactionId = randomUUID();
      const transactionPayload: NewTransaction = {
        transactionId,
        occurredOn: new Date(body.occurredOn),
        amount: amount.toFixed(2),
        fee: fee.toFixed(2),
        type: body.type,
        status: body.status,
        accountId: body.accountId,
        personId: body.personId || null,
        categoryId: body.categoryId || null,
        shopId: body.shopId || null,
        linkedTxnId: body.linkedTxnId || null,
        subscriptionMemberId: body.subscriptionMemberId || null,
        notes: body.notes || null,
      };
      const [createdTxn] = await database.insert(transactions).values(transactionPayload).returning();

      // Update ledgers
      await updateLedgersOnTransaction(createdTxn, body);

      res.status(201).json(createdTxn);
    } catch (error) {
      console.error("Failed to create transaction", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: message });
    }
    return;
  }

  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).json({ error: "Method not allowed" });
}
