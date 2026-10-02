ALTER TABLE storage.s3_multipart_uploads ALTER COLUMN in_progress_size TYPE bigint;
ALTER TABLE storage.s3_multipart_uploads_parts ALTER COLUMN size TYPE bigint;