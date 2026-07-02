-- Performance indexes for high-frequency CPEK filters.
-- Safe to re-run in Supabase because every index uses IF NOT EXISTS.

CREATE INDEX IF NOT EXISTS idx_company_tenant_active
  ON company (tenant_id, active);

CREATE INDEX IF NOT EXISTS idx_bank_account_tenant_company_active
  ON bank_account (tenant_id, company_id, active);

CREATE INDEX IF NOT EXISTS idx_catalog_value_tenant_company_kind_active
  ON catalog_value (tenant_id, company_id, kind, active);

CREATE INDEX IF NOT EXISTS idx_contact_tenant_company_type_active
  ON contact (tenant_id, company_id, type, active);

CREATE INDEX IF NOT EXISTS idx_cost_center_tenant_company_active
  ON cost_center (tenant_id, company_id, active);

CREATE INDEX IF NOT EXISTS idx_fee_profile_tenant_company_active
  ON fee_profile (tenant_id, company_id, active);

CREATE INDEX IF NOT EXISTS idx_custom_field_tenant_company_kind_active
  ON custom_field (tenant_id, company_id, kind, active);

CREATE INDEX IF NOT EXISTS idx_period_tenant_company_year_month_status
  ON period (tenant_id, company_id, year, month, status);

CREATE INDEX IF NOT EXISTS idx_entry_tenant_company_period_paid
  ON entry (tenant_id, company_id, period_id, data_pagamento);

CREATE INDEX IF NOT EXISTS idx_entry_tenant_company_service
  ON entry (tenant_id, company_id, service_id);

CREATE INDEX IF NOT EXISTS idx_exit_tenant_company_period_paid_due
  ON exit (tenant_id, company_id, period_id, data_pagamento, data_vencimento);

CREATE INDEX IF NOT EXISTS idx_exit_tenant_company_cost_center
  ON exit (tenant_id, company_id, cost_center_id);

CREATE INDEX IF NOT EXISTS idx_closing_tenant_company_period_received_due
  ON closing (tenant_id, company_id, period_id, data_recebimento, data_venc_prev);
