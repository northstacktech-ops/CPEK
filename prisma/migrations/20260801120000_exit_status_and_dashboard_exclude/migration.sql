-- Exit ganha status persistido (mesmo padrão de Entry/Closing, sem FK).
ALTER TABLE "exit" ADD COLUMN "status_id" UUID;

-- CatalogValue ganha exclude_from_dashboard (só relevante para kind=STATUS):
-- lançamento com esse status some de todo cálculo do Dashboard, aparecendo
-- só somado no DRE. Usado pelo status "Consolidado".
ALTER TABLE "catalog_value" ADD COLUMN "exclude_from_dashboard" BOOLEAN NOT NULL DEFAULT false;
