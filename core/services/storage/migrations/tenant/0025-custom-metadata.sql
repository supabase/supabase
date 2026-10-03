ALTER TABLE storage.objects ADD COLUMN IF NOT EXISTS user_metadata jsonb NULL;
ALTER TABLE storage.s3_multipart_uploads ADD COLUMN IF NOT EXISTS user_metadata jsonb NULL;