-- YourMind: a private place to save links, notes and images, searchable by
-- meaning.
--
-- Every item belongs to one person and is only visible to them. When an item
-- is saved, the `save-item` Edge Function reads link previews and embeds the
-- item's text with the built-in gte-small model; `search` embeds a query and
-- ranks items by cosine similarity with pgvector.

create extension if not exists vector with schema extensions;

create type public.item_kind as enum ('note', 'link', 'image');
create type public.item_status as enum ('processing', 'ready', 'failed');

create table public.items (
  id uuid primary key default gen_random_uuid(),
  kind public.item_kind not null,
  title text check (char_length(title) <= 300),
  -- A note's text, a link's description, or an image's caption.
  body text check (char_length(body) <= 5000),
  url text check (url ~ '^https?://' and char_length(url) <= 2000),
  site_name text check (char_length(site_name) <= 200),
  -- Preview image for links, from the page's og:image.
  image_url text check (image_url ~ '^https?://' and char_length(image_url) <= 2000),
  -- Uploaded image: `<user id>/<item id>.<ext>` in the private `minds` bucket.
  image_path text,
  status public.item_status not null default 'processing',
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  check (kind <> 'link' or url is not null),
  check (kind <> 'image' or image_path is not null),
  check (image_path is null or image_path like created_by::text || '/%')
);

-- Embeddings live in their own table so the items the app syncs stay small.
create table public.item_embeddings (
  item_id uuid primary key references public.items (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  embedding extensions.vector(384) not null
);

create index items_created_by_created_at_idx on public.items (created_by, created_at desc);
create index item_embeddings_created_by_idx on public.item_embeddings (created_by);
create index item_embeddings_embedding_idx
  on public.item_embeddings using hnsw (embedding extensions.vector_cosine_ops);

alter table public.items enable row level security;
alter table public.item_embeddings enable row level security;

-- New tables aren't exposed to the Data API without explicit grants (the
-- default for new projects), so grant exactly what the policies below allow.
grant select, insert, update, delete on public.items to authenticated;
grant select, insert, update on public.item_embeddings to authenticated;

create policy "Users can view their items"
on public.items for select
to authenticated
using (created_by = (select auth.uid()));

create policy "Users can save items"
on public.items for insert
to authenticated
with check (created_by = (select auth.uid()));

create policy "Users can edit their items"
on public.items for update
to authenticated
using (created_by = (select auth.uid()))
with check (created_by = (select auth.uid()));

create policy "Users can delete their items"
on public.items for delete
to authenticated
using (created_by = (select auth.uid()));

create policy "Users can view their embeddings"
on public.item_embeddings for select
to authenticated
using (created_by = (select auth.uid()));

create policy "Users can save embeddings for their items"
on public.item_embeddings for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and exists (
    select 1 from public.items
    where items.id = item_id and items.created_by = (select auth.uid())
  )
);

create policy "Users can update their embeddings"
on public.item_embeddings for update
to authenticated
using (created_by = (select auth.uid()))
with check (
  created_by = (select auth.uid())
  and exists (
    select 1 from public.items
    where items.id = item_id and items.created_by = (select auth.uid())
  )
);

-- Up to 500 items per person.
create function public.check_item_limit()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (select count(*) from public.items where created_by = new.created_by) >= 500 then
    raise exception 'You can save up to 500 items.' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger check_item_limit
before insert on public.items
for each row execute function public.check_item_limit();

-- Semantic search over the caller's own items (security invoker, so the
-- policies above still apply).
create function public.match_items(
  query_embedding extensions.vector(384),
  match_count integer default 20,
  min_similarity double precision default 0.78
)
returns table (item_id uuid, similarity double precision)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    item_embeddings.item_id,
    1 - (item_embeddings.embedding operator(extensions.<=>) query_embedding) as similarity
  from public.item_embeddings
  where item_embeddings.created_by = (select auth.uid())
    and 1 - (item_embeddings.embedding operator(extensions.<=>) query_embedding) >= min_similarity
  order by item_embeddings.embedding operator(extensions.<=>) query_embedding
  limit least(match_count, 50);
$$;

-- Images: a private bucket with a folder per person.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'minds',
  'minds',
  false,
  5 * 1024 * 1024,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

create policy "Users can upload to their folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'minds'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can view their images"
on storage.objects for select
to authenticated
using (
  bucket_id = 'minds'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can delete their images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'minds'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- Stream item changes (such as a link preview arriving) to the owner.
alter publication supabase_realtime add table public.items;
