insert into "storage"."buckets"
  (
    "id",
    "name",
    "owner",
    "created_at",
    "updated_at",
    "public",
    "avif_autodetection",
    "file_size_limit",
    "allowed_mime_types",
    "owner_id"
  )
values
  ('images', 'images', null, now(), now(), true, false, null, null, null);
