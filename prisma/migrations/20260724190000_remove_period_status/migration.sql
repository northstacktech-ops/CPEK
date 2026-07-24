-- Remove o ambiente de fechar/reabrir período: o período agora é sempre
-- automático, resolvido pela data do lançamento, sem trava manual. A regra
-- que resta é bloquear data futura (validada em server/utils/period.ts).
ALTER TABLE "period" DROP COLUMN "status";
ALTER TABLE "period" DROP COLUMN "closed_at";
ALTER TABLE "period" DROP COLUMN "closed_by_id";

DROP TYPE "PeriodStatus";
