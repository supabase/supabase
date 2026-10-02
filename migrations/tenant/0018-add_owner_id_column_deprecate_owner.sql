alter table storage.objects add column if not exists owner_id text default null;
alter table storage.buckets add column if not exists owner_id text default null;

comment on column storage.objects.owner is 'Field is deprecated, use owner_id instead';
comment on column storage.buckets.owner is 'Field is deprecated, use owner_id instead';

ALTER TABLE storage.buckets
    DROP CONSTRAINT IF EXISTS buckets_owner_fkey;
