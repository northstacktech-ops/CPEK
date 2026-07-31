-- "Vencidos" no dashboard passou a varrer TODOS os períodos da empresa (não só
-- o mês selecionado no filtro) — ver server/api/dashboard.get.ts. Os índices
-- existentes (idx_exit_tenant_company_period_paid_due /
-- idx_closing_tenant_company_period_received_due) têm period_id como coluna
-- intermediária e não ajudam essa consulta, que não filtra por período.
-- Safe to re-run in Supabase: usa IF NOT EXISTS.

CREATE INDEX IF NOT EXISTS idx_exit_tenant_company_data_vencimento
  ON exit (tenant_id, company_id, data_vencimento);

CREATE INDEX IF NOT EXISTS idx_closing_tenant_company_data_venc_prev
  ON closing (tenant_id, company_id, data_venc_prev);
