-- CPEK — migration inicial (Fase 0). Gerada a partir de prisma/schema.prisma.
-- Aplicar com DIRECT_URL (papel postgres). Depois rodar prisma/rls/policies.sql.

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MEMBER');
CREATE TYPE "EntryKind" AS ENUM ('ENTRY', 'EXIT', 'CLOSING');
CREATE TYPE "PeriodStatus" AS ENUM ('OPEN', 'CLOSED');
CREATE TYPE "ContactType" AS ENUM ('CLIENT', 'SUPPLIER');
CREATE TYPE "CostType" AS ENUM ('FIXED', 'VARIABLE');
CREATE TYPE "FieldType" AS ENUM ('TEXT', 'NUMBER', 'CURRENCY', 'DATE', 'SELECT');
CREATE TYPE "CatalogKind" AS ENUM ('PAYMENT_METHOD', 'SERVICE', 'STATUS', 'CATEGORY');
CREATE TYPE "DreGroup" AS ENUM ('OPERATING_REVENUE', 'OPERATING_COST', 'OPERATING_EXPENSE', 'OTHER_REVENUE', 'INVESTING', 'FINANCING');
CREATE TYPE "FeeType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateTable
CREATE TABLE "account" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "app_user" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "app_user_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "form_permission" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "resource" TEXT NOT NULL,
    CONSTRAINT "form_permission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "company" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "segment" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "company_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "catalog_value" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "kind" "CatalogKind" NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "dre_group" "DreGroup",
    CONSTRAINT "catalog_value_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "cost_center" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "cost_type" "CostType" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "cost_center_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "fee_profile" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "fee_type" "FeeType" NOT NULL,
    "value" DECIMAL(14,4) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "fee_profile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bank_account" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "opening_balance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bank_account_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "contact" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "company_id" UUID,
    "type" "ContactType" NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "cnpj_cpf" TEXT,
    "contact" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "contact_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "custom_field" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "kind" "EntryKind" NOT NULL,
    "field_key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "data_type" "FieldType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "options" JSONB,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "custom_field_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "period" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "status" "PeriodStatus" NOT NULL DEFAULT 'OPEN',
    "closed_at" TIMESTAMP(3),
    "closed_by_id" UUID,
    CONSTRAINT "period_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "entry" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "period_id" UUID NOT NULL,
    "bank_account_id" UUID,
    "contact_id" UUID,
    "service_id" UUID,
    "category_id" UUID,
    "payment_id" UUID,
    "status_id" UUID,
    "fee_profile_id" UUID,
    "valor_servico" DECIMAL(14,2) NOT NULL,
    "deslocamento" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "placa" TEXT,
    "modelo" TEXT,
    "data_servico" TIMESTAMP(3),
    "data_pagamento" TIMESTAMP(3),
    "documento_nf" TEXT,
    "anotacoes" TEXT,
    "custom_snapshot" JSONB,
    "created_by_id" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "entry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "exit" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "period_id" UUID NOT NULL,
    "bank_account_id" UUID,
    "contact_id" UUID,
    "cost_center_id" UUID,
    "category_id" UUID,
    "payment_id" UUID,
    "valor_despesa" DECIMAL(14,2) NOT NULL,
    "descricao" TEXT,
    "data_lancamento" TIMESTAMP(3),
    "data_vencimento" TIMESTAMP(3),
    "data_pagamento" TIMESTAMP(3),
    "documento_nf" TEXT,
    "anotacoes" TEXT,
    "custom_snapshot" JSONB,
    "created_by_id" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "exit_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "closing" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "period_id" UUID NOT NULL,
    "bank_account_id" UUID,
    "contact_id" UUID,
    "category_id" UUID,
    "status_id" UUID,
    "valor_fechamento" DECIMAL(14,2) NOT NULL,
    "descricao" TEXT,
    "data_fechamento" TIMESTAMP(3),
    "data_venc_prev" TIMESTAMP(3),
    "data_recebimento" TIMESTAMP(3),
    "documento_nf" TEXT,
    "custom_snapshot" JSONB,
    "created_by_id" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "closing_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_log" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "app_user_tenant_id_idx" ON "app_user"("tenant_id");
CREATE INDEX "form_permission_tenant_id_idx" ON "form_permission"("tenant_id");
CREATE UNIQUE INDEX "form_permission_userId_resource_key" ON "form_permission"("userId", "resource");
CREATE INDEX "company_tenant_id_idx" ON "company"("tenant_id");
CREATE INDEX "catalog_value_tenant_id_company_id_kind_idx" ON "catalog_value"("tenant_id", "company_id", "kind");
CREATE INDEX "cost_center_tenant_id_company_id_idx" ON "cost_center"("tenant_id", "company_id");
CREATE INDEX "fee_profile_tenant_id_company_id_idx" ON "fee_profile"("tenant_id", "company_id");
CREATE INDEX "bank_account_tenant_id_company_id_idx" ON "bank_account"("tenant_id", "company_id");
CREATE INDEX "contact_tenant_id_company_id_type_idx" ON "contact"("tenant_id", "company_id", "type");
CREATE INDEX "custom_field_tenant_id_idx" ON "custom_field"("tenant_id");
CREATE UNIQUE INDEX "custom_field_company_id_kind_field_key_key" ON "custom_field"("company_id", "kind", "field_key");
CREATE INDEX "period_tenant_id_idx" ON "period"("tenant_id");
CREATE UNIQUE INDEX "period_company_id_year_month_key" ON "period"("company_id", "year", "month");
CREATE INDEX "entry_tenant_id_company_id_period_id_idx" ON "entry"("tenant_id", "company_id", "period_id");
CREATE INDEX "entry_tenant_id_company_id_category_id_idx" ON "entry"("tenant_id", "company_id", "category_id");
CREATE INDEX "exit_tenant_id_company_id_period_id_idx" ON "exit"("tenant_id", "company_id", "period_id");
CREATE INDEX "exit_tenant_id_company_id_category_id_idx" ON "exit"("tenant_id", "company_id", "category_id");
CREATE INDEX "closing_tenant_id_company_id_period_id_idx" ON "closing"("tenant_id", "company_id", "period_id");
CREATE INDEX "audit_log_tenant_id_createdAt_idx" ON "audit_log"("tenant_id", "createdAt");

-- AddForeignKey
ALTER TABLE "app_user" ADD CONSTRAINT "app_user_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "form_permission" ADD CONSTRAINT "form_permission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "company" ADD CONSTRAINT "company_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "catalog_value" ADD CONSTRAINT "catalog_value_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cost_center" ADD CONSTRAINT "cost_center_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "fee_profile" ADD CONSTRAINT "fee_profile_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bank_account" ADD CONSTRAINT "bank_account_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bank_account" ADD CONSTRAINT "bank_account_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contact" ADD CONSTRAINT "contact_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "custom_field" ADD CONSTRAINT "custom_field_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "period" ADD CONSTRAINT "period_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "entry" ADD CONSTRAINT "entry_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "period"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "entry" ADD CONSTRAINT "entry_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "entry" ADD CONSTRAINT "entry_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "bank_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "exit" ADD CONSTRAINT "exit_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "period"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "exit" ADD CONSTRAINT "exit_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "exit" ADD CONSTRAINT "exit_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "bank_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "closing" ADD CONSTRAINT "closing_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "period"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "closing" ADD CONSTRAINT "closing_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "closing" ADD CONSTRAINT "closing_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "bank_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
