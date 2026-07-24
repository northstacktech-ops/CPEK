-- Remove conta bancária do produto: dropa a coluna bank_account_id (e a FK
-- correspondente) de entry/exit/closing, e a tabela bank_account inteira.
ALTER TABLE "entry" DROP COLUMN "bank_account_id";
ALTER TABLE "exit" DROP COLUMN "bank_account_id";
ALTER TABLE "closing" DROP COLUMN "bank_account_id";

DROP TABLE "bank_account" CASCADE;
