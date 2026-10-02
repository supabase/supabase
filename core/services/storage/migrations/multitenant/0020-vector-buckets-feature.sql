ALTER TABLE tenants ADD COLUMN IF NOT EXISTS feature_vector_buckets boolean NOT NULL DEFAULT false;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS feature_vector_buckets_max_buckets int NOT NULL DEFAULT 10;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS feature_vector_buckets_max_indexes int NOT NULL DEFAULT 5;
