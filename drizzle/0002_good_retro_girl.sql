CREATE TYPE "public"."account_status" AS ENUM('active', 'closed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."account_type" AS ENUM('bank', 'credit', 'saving', 'invest', 'e-wallet', 'group', 'loan', 'mortgage', 'cash', 'other');--> statement-breakpoint
CREATE TYPE "public"."asset_status" AS ENUM('active', 'sold', 'transferred', 'frozen');--> statement-breakpoint
CREATE TYPE "public"."asset_type" AS ENUM('saving', 'invest', 'real_estate', 'crypto', 'bond', 'collateral', 'other');--> statement-breakpoint
CREATE TYPE "public"."batch_import_status" AS ENUM('pending', 'processing', 'done');--> statement-breakpoint
CREATE TYPE "public"."batch_import_type" AS ENUM('transfer', 'payment', 'topup', 'other');--> statement-breakpoint
CREATE TYPE "public"."cashback_eligibility" AS ENUM('eligible', 'not_eligible', 'reached_cap', 'pending');--> statement-breakpoint
CREATE TYPE "public"."cashback_ledger_status" AS ENUM('open', 'closed');--> statement-breakpoint
CREATE TYPE "public"."cashback_status" AS ENUM('init', 'applied', 'exceed_cap', 'invalidated');--> statement-breakpoint
CREATE TYPE "public"."cashback_type" AS ENUM('percent', 'fixed');--> statement-breakpoint
CREATE TYPE "public"."category_kind" AS ENUM('expense', 'income', 'transfer', 'debt', 'cashback', 'subscription', 'other');--> statement-breakpoint
CREATE TYPE "public"."debt_ledger_status" AS ENUM('open', 'partial', 'repaid', 'overdue');--> statement-breakpoint
CREATE TYPE "public"."debt_movement_status" AS ENUM('active', 'settled', 'reversed');--> statement-breakpoint
CREATE TYPE "public"."debt_movement_type" AS ENUM('borrow', 'repay', 'adjust', 'discount', 'split');--> statement-breakpoint
CREATE TYPE "public"."shop_status" AS ENUM('active', 'hidden');--> statement-breakpoint
CREATE TYPE "public"."shop_type" AS ENUM('food', 'retail', 'digital', 'service', 'other');--> statement-breakpoint
CREATE TYPE "public"."subscription_interval" AS ENUM('weekly', 'monthly', 'quarterly', 'yearly', 'custom');--> statement-breakpoint
CREATE TYPE "public"."subscription_member_role" AS ENUM('owner', 'member', 'participant', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."subscription_member_status" AS ENUM('active', 'left', 'inactive', 'pending');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'paused', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."subscription_type" AS ENUM('youtube', 'icloud', 'spotify', 'netflix', 'other');--> statement-breakpoint
CREATE TYPE "public"."transaction_history_action" AS ENUM('update', 'delete', 'cashback_update');--> statement-breakpoint
CREATE TYPE "public"."linked_txn_status" AS ENUM('active', 'done', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."linked_txn_type" AS ENUM('refund', 'split', 'batch', 'settle');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('active', 'pending', 'void', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('expense', 'income', 'debt', 'repayment', 'cashback', 'subscription', 'import', 'adjustment');--> statement-breakpoint
CREATE TABLE "accounts" (
	"account_id" varchar(36) PRIMARY KEY NOT NULL,
	"account_name" varchar(120) NOT NULL,
	"img_url" text,
	"account_type" "account_type" NOT NULL,
	"parent_account_id" varchar(36),
	"asset_ref" varchar(36),
	"opening_balance" numeric(18, 2) NOT NULL,
	"current_balance" numeric(18, 2) NOT NULL,
	"status" "account_status" NOT NULL,
	"total_in" numeric(18, 2) DEFAULT '0' NOT NULL,
	"total_out" numeric(18, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"asset_id" varchar(36) PRIMARY KEY NOT NULL,
	"asset_name" varchar(180) NOT NULL,
	"asset_type" "asset_type" NOT NULL,
	"owner_id" varchar(36) NOT NULL,
	"linked_account_id" varchar(36),
	"status" "asset_status" NOT NULL,
	"current_value" numeric(18, 2) NOT NULL,
	"initial_value" numeric(18, 2),
	"currency" varchar(10),
	"acquired_at" date,
	"img_url" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "batch_imports" (
	"batch_import_id" varchar(36) PRIMARY KEY NOT NULL,
	"batch_name" varchar(160) NOT NULL,
	"import_type" "batch_import_type" NOT NULL,
	"status" "batch_import_status" NOT NULL,
	"account_id" varchar(36) NOT NULL,
	"total_amount" numeric(18, 2) NOT NULL,
	"deadline" date NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "card_pl" (
	"card_pl_id" varchar(36) PRIMARY KEY NOT NULL,
	"account_id" varchar(36) NOT NULL,
	"year" varchar(9) NOT NULL,
	"total_earned" numeric(18, 2) DEFAULT '0' NOT NULL,
	"total_fee" numeric(18, 2) DEFAULT '0' NOT NULL,
	"net_pl" numeric(18, 2) GENERATED ALWAYS AS (coalesce("total_earned", 0) - coalesce("total_fee", 0)) STORED,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cashback_ledger" (
	"cashback_ledger_id" varchar(36) PRIMARY KEY NOT NULL,
	"account_id" varchar(36) NOT NULL,
	"cycle_tag" varchar(10) NOT NULL,
	"total_spend" numeric(18, 2) DEFAULT '0' NOT NULL,
	"total_cashback" numeric(18, 2) DEFAULT '0' NOT NULL,
	"budget_cap" numeric(18, 2) DEFAULT '0' NOT NULL,
	"eligibility" "cashback_eligibility" NOT NULL,
	"remaining_budget" numeric(18, 2) DEFAULT '0' NOT NULL,
	"status" "cashback_ledger_status" NOT NULL,
	"notes" text,
	"last_updated" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cashback_movements" (
	"cashback_movement_id" varchar(36) PRIMARY KEY NOT NULL,
	"transaction_id" varchar(36) NOT NULL,
	"account_id" varchar(36) NOT NULL,
	"cycle_tag" varchar(10) NOT NULL,
	"cashback_type" "cashback_type" NOT NULL,
	"cashback_value" numeric(18, 4) NOT NULL,
	"cashback_amount" numeric(18, 2) NOT NULL,
	"status" "cashback_status" NOT NULL,
	"budget_cap" numeric(18, 2),
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"category_id" varchar(36) PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"kind" "category_kind" NOT NULL,
	"parent_category_id" varchar(36),
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "debt_ledger" (
	"debt_ledger_id" varchar(36) PRIMARY KEY NOT NULL,
	"person_id" varchar(36) NOT NULL,
	"cycle_tag" varchar(10),
	"initial_debt" numeric(18, 2) DEFAULT '0' NOT NULL,
	"new_debt" numeric(18, 2) DEFAULT '0' NOT NULL,
	"repayments" numeric(18, 2) DEFAULT '0' NOT NULL,
	"debt_discount" numeric(18, 2) DEFAULT '0',
	"net_debt" numeric(18, 2) DEFAULT '0' NOT NULL,
	"status" "debt_ledger_status" NOT NULL,
	"last_updated" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "debt_movements" (
	"debt_movement_id" varchar(36) PRIMARY KEY NOT NULL,
	"transaction_id" varchar(36) NOT NULL,
	"person_id" varchar(36) NOT NULL,
	"account_id" varchar(36) NOT NULL,
	"movement_type" "debt_movement_type" NOT NULL,
	"amount" numeric(18, 2) NOT NULL,
	"cycle_tag" varchar(10),
	"status" "debt_movement_status" NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shops" (
	"shop_id" varchar(36) PRIMARY KEY NOT NULL,
	"shop_name" varchar(180) NOT NULL,
	"shop_type" "shop_type" NOT NULL,
	"img_url" text,
	"url" text,
	"status" "shop_status" NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_members" (
	"member_id" varchar(36) PRIMARY KEY NOT NULL,
	"subscription_id" varchar(36) NOT NULL,
	"person_id" varchar(36) NOT NULL,
	"reimbursement_account_id" varchar(36),
	"role" "subscription_member_role" DEFAULT 'participant' NOT NULL,
	"join_date" date NOT NULL,
	"leave_date" date,
	"share_ratio" numeric(5, 4),
	"status" "subscription_member_status" DEFAULT 'active' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_members_share_ratio_check" CHECK (share_ratio IS NULL OR (share_ratio >= 0 AND share_ratio <= 1))
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"subscription_id" varchar(36) PRIMARY KEY NOT NULL,
	"name" varchar(180) NOT NULL,
	"provider" varchar(120),
	"type" "subscription_type" NOT NULL,
	"price_per_month" numeric(12, 2) NOT NULL,
	"currency_code" varchar(10) DEFAULT 'USD',
	"billing_interval" "subscription_interval" NOT NULL,
	"next_billing_date" date,
	"owner_id" varchar(36) NOT NULL,
	"billing_account_id" varchar(36) NOT NULL,
	"status" "subscription_status" DEFAULT 'active' NOT NULL,
	"image_url" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transaction_history" (
	"history_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" varchar(36) NOT NULL,
	"old_amount" numeric(18, 2),
	"new_amount" numeric(18, 2),
	"old_cashback" numeric(18, 2),
	"new_cashback" numeric(18, 2),
	"old_debt" numeric(18, 2),
	"new_debt" numeric(18, 2),
	"action_type" "transaction_history_action" NOT NULL,
	"seq_no" integer DEFAULT 1 NOT NULL,
	"edited_by" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "linked_transactions" (
	"linked_txn_id" varchar(36) PRIMARY KEY NOT NULL,
	"parent_txn_id" varchar(36),
	"type" "linked_txn_type" NOT NULL,
	"related_txn_ids" varchar(36)[] DEFAULT ARRAY[]::varchar[] NOT NULL,
	"notes" text,
	"status" "linked_txn_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"transaction_id" varchar(36) PRIMARY KEY NOT NULL,
	"account_id" varchar(36) NOT NULL,
	"person_id" varchar(36),
	"shop_id" varchar(36),
	"type" "transaction_type" NOT NULL,
	"category_id" varchar(36),
	"subscription_member_id" varchar(36),
	"linked_txn_id" varchar(36),
	"status" "transaction_status" NOT NULL,
	"amount" numeric(18, 2) NOT NULL,
	"fee" numeric(18, 2),
	"occurred_on" date NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_asset_ref_assets_asset_id_fk" FOREIGN KEY ("asset_ref") REFERENCES "public"."assets"("asset_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_parent_account_id_fkey" FOREIGN KEY ("parent_account_id") REFERENCES "public"."accounts"("account_id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_asset_ref_fkey" FOREIGN KEY ("asset_ref") REFERENCES "public"."assets"("asset_id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_owner_id_people_person_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."people"("person_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_linked_account_id_accounts_account_id_fk" FOREIGN KEY ("linked_account_id") REFERENCES "public"."accounts"("account_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_imports" ADD CONSTRAINT "batch_imports_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("account_id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "batch_imports" ADD CONSTRAINT "batch_imports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."people"("person_id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "card_pl" ADD CONSTRAINT "card_pl_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("account_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "cashback_ledger" ADD CONSTRAINT "cashback_ledger_account_id_accounts_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("account_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cashback_movements" ADD CONSTRAINT "cashback_movements_transaction_id_transactions_transaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("transaction_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cashback_movements" ADD CONSTRAINT "cashback_movements_account_id_accounts_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("account_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_category_id_fkey" FOREIGN KEY ("parent_category_id") REFERENCES "public"."categories"("category_id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "debt_ledger" ADD CONSTRAINT "debt_ledger_person_id_people_person_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("person_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debt_movements" ADD CONSTRAINT "debt_movements_transaction_id_transactions_transaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("transaction_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debt_movements" ADD CONSTRAINT "debt_movements_person_id_people_person_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("person_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debt_movements" ADD CONSTRAINT "debt_movements_account_id_accounts_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("account_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_members" ADD CONSTRAINT "subscription_members_subscription_id_subscriptions_subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("subscription_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_members" ADD CONSTRAINT "subscription_members_person_id_people_person_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("person_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_members" ADD CONSTRAINT "subscription_members_reimbursement_account_id_accounts_account_id_fk" FOREIGN KEY ("reimbursement_account_id") REFERENCES "public"."accounts"("account_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_members" ADD CONSTRAINT "subscription_members_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("subscription_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "subscription_members" ADD CONSTRAINT "subscription_members_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "public"."people"("person_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "subscription_members" ADD CONSTRAINT "subscription_members_reimbursement_account_id_fkey" FOREIGN KEY ("reimbursement_account_id") REFERENCES "public"."accounts"("account_id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_owner_id_people_person_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."people"("person_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_billing_account_id_accounts_account_id_fk" FOREIGN KEY ("billing_account_id") REFERENCES "public"."accounts"("account_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "linked_transactions" ADD CONSTRAINT "linked_transactions_parent_txn_id_transactions_transaction_id_fk" FOREIGN KEY ("parent_txn_id") REFERENCES "public"."transactions"("transaction_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "linked_transactions" ADD CONSTRAINT "linked_transactions_parent_txn_id_fkey" FOREIGN KEY ("parent_txn_id") REFERENCES "public"."transactions"("transaction_id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_accounts_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("account_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_person_id_people_person_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("person_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_shop_id_shops_shop_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("shop_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_categories_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("category_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_subscription_member_id_subscription_members_member_id_fk" FOREIGN KEY ("subscription_member_id") REFERENCES "public"."subscription_members"("member_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_linked_txn_id_linked_transactions_linked_txn_id_fk" FOREIGN KEY ("linked_txn_id") REFERENCES "public"."linked_transactions"("linked_txn_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cashback_ledger_account_cycle_uidx" ON "cashback_ledger" USING btree ("account_id","cycle_tag");--> statement-breakpoint
CREATE INDEX "cashback_movements_account_cycle_idx" ON "cashback_movements" USING btree ("account_id","cycle_tag");--> statement-breakpoint
CREATE UNIQUE INDEX "debt_ledger_person_cycle_uidx" ON "debt_ledger" USING btree ("person_id","cycle_tag");--> statement-breakpoint
CREATE INDEX "debt_movements_person_account_idx" ON "debt_movements" USING btree ("person_id","account_id");--> statement-breakpoint
CREATE INDEX "debt_movements_account_cycle_idx" ON "debt_movements" USING btree ("account_id","cycle_tag");--> statement-breakpoint
CREATE UNIQUE INDEX "subscription_members_subscription_person_idx" ON "subscription_members" USING btree ("subscription_id","person_id");--> statement-breakpoint
CREATE UNIQUE INDEX "subscriptions_account_name_uidx" ON "subscriptions" USING btree ("billing_account_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "transaction_history_transaction_seq_idx" ON "transaction_history" USING btree ("transaction_id","seq_no");--> statement-breakpoint
CREATE INDEX "transaction_history_transaction_id_idx" ON "transaction_history" USING btree ("transaction_id");