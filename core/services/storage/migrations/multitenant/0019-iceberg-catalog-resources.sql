ALTER TABLE tenants ADD COLUMN IF NOT EXISTS feature_iceberg_catalog boolean NOT NULL DEFAULT false;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS feature_iceberg_catalog_max_namespaces int NOT NULL DEFAULT 10;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS feature_iceberg_catalog_max_tables int NOT NULL DEFAULT 10;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS feature_iceberg_catalog_max_catalogs int NOT NULL DEFAULT 2;

CREATE TABLE IF NOT EXISTS iceberg_catalogs (
  id text not null,
  tenant_id text NOT NULL,
  created_at timestamptz NOT NULL default now(),
  updated_at timestamptz NOT NULL default now(),

  primary key (id, tenant_id)
);

CREATE TABLE IF NOT EXISTS iceberg_namespaces (
  id uuid primary key default gen_random_uuid(),
  tenant_id text NOT NULL,
  bucket_id text NOT NULL,
  name text COLLATE "C" NOT NULL,
  created_at timestamptz NOT NULL default now(),
  updated_at timestamptz NOT NULL default now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_iceberg_namespaces_bucket_id ON iceberg_namespaces (tenant_id, bucket_id, name);

CREATE TABLE IF NOT EXISTS iceberg_tables (
  id uuid primary key default gen_random_uuid(),
  tenant_id text NOT NULL,
  namespace_id uuid NOT NULL references iceberg_namespaces(id) ON DELETE CASCADE,
  bucket_id text NOT NULL,
  name text COLLATE "C" NOT NULL,
  location text not null,
  created_at timestamptz NOT NULL default now(),
  updated_at timestamptz NOT NULL default now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_iceberg_tables_tenant_namespace_id ON iceberg_tables (tenant_id, namespace_id, name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_iceberg_tables_tenant_location ON iceberg_tables (tenant_id, location);
CREATE UNIQUE INDEX IF NOT EXISTS idx_iceberg_tables_location ON iceberg_tables (location);