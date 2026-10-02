

ALTER TABLE tenants_s3_credentials ADD COLUMN claims json NOT NULL DEFAULT '{}';
