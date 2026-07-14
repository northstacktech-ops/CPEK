-- Ajustes do Cleber (reunião 2026-07): campos fiscais/operacionais novos.
-- Aditiva e idempotente (IF NOT EXISTS), segura para re-execução no Supabase.

ALTER TABLE "entry"
  ADD COLUMN IF NOT EXISTS "pesquisa" DECIMAL(14,2),
  ADD COLUMN IF NOT EXISTS "retorno" DECIMAL(14,2),
  ADD COLUMN IF NOT EXISTS "nota_fiscal" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "company"
  ADD COLUMN IF NOT EXISTS "royalties_percent" DECIMAL(14,4),
  ADD COLUMN IF NOT EXISTS "imposto_nf_percent" DECIMAL(14,4);
