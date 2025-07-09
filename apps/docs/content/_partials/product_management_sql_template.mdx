```sql
-- Create a table for public profiles

create table
  public.products (
    id uuid not null default gen_random_uuid (),
    name text not null,
    price real not null,
    image text null,
    constraint products_pkey primary key (id)
  ) tablespace pg_default;

-- Set up Storage!
insert into storage.buckets (id, name)
  values ('Product Image', 'Product Image');

-- Set up access controls for storage.
-- See https://supabase.com/docs/guides/storage/security/access-control#policy-examples for more details.
CREATE POLICY "Enable read access for all users" ON "storage"."objects"
AS PERMISSIVE FOR SELECT
TO public
USING (true)

CREATE POLICY "Enable insert for all users" ON "storage"."objects"
AS PERMISSIVE FOR INSERT
TO authenticated, anon
WITH CHECK (true)

CREATE POLICY "Enable update for all users" ON "storage"."objects"
AS PERMISSIVE FOR UPDATE
TO public
USING (true)
WITH CHECK (true)

```
