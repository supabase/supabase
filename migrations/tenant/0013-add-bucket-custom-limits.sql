alter table storage.buckets add column if not exists max_file_size_kb int default null;
alter table storage.buckets add column if not exists allowed_mime_types text[] default null;