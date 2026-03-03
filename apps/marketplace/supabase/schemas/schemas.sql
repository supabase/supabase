-- Marketplace schema (declarative)
-- Goal: community-submitted marketplace items with Supabase approval workflow.

-- Enums
create type public.marketplace_item_type as enum ('oauth', 'template');
create type public.marketplace_review_status as enum (
  'draft',
  'pending_review',
  'approved',
  'rejected'
);

-- Helper predicates for RLS
create function public.is_supabase_team_member()
returns boolean
language sql
stable
as $$
  select coalesce(lower(auth.jwt() ->> 'email') like '%@supabase.io', false);
$$;

-- Partners represent companies/projects that publish marketplace items.
create table public.partners (
  id bigint generated always as identity primary key,
  slug text not null unique,
  title text not null,
  reviewer boolean not null default false,
  description text,
  website text,
  logo_url text,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partners_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.partner_members (
  partner_id bigint not null references public.partners (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  primary key (partner_id, user_id),
  constraint partner_members_role_check check (role in ('member', 'admin'))
);

create function public.is_partner_member(target_partner_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.partner_members pm
    where pm.partner_id = target_partner_id
      and pm.user_id = auth.uid()
  ) or exists (
    select 1
    from public.partners p
    where p.id = target_partner_id
      and p.created_by = auth.uid()
  );
$$;

create function public.is_partner_admin(target_partner_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.partner_members pm
    where pm.partner_id = target_partner_id
      and pm.user_id = auth.uid()
      and pm.role = 'admin'
  );
$$;

create function public.is_reviewer_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.partner_members pm
    inner join public.partners p on p.id = pm.partner_id
    where pm.user_id = auth.uid()
      and p.reviewer = true
  );
$$;

create function public.storage_object_partner_id(object_name text)
returns bigint
language sql
stable
as $$
  select case
    when split_part(object_name, '/', 1) ~ '^[0-9]+$' then split_part(object_name, '/', 1)::bigint
    else null
  end;
$$;

create function public.storage_object_item_id(object_name text)
returns bigint
language sql
stable
as $$
  select case
    when split_part(object_name, '/', 3) ~ '^[0-9]+$' then split_part(object_name, '/', 3)::bigint
    else null
  end;
$$;

create function public.add_partner_member(
  target_partner_id bigint,
  target_email text,
  target_role text default 'member'
)
returns public.partner_members
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_role text;
  target_user_id uuid;
  inserted_row public.partner_members;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_partner_admin(target_partner_id) then
    raise exception 'Only partner admins can add members';
  end if;

  normalized_role := lower(trim(coalesce(target_role, 'member')));
  if normalized_role not in ('member', 'admin') then
    raise exception 'Invalid member role';
  end if;

  select u.id
  into target_user_id
  from auth.users u
  where lower(u.email) = lower(trim(target_email))
  limit 1;

  if target_user_id is null then
    raise exception 'No user found with that email';
  end if;

  insert into public.partner_members (partner_id, user_id, role)
  values (target_partner_id, target_user_id, normalized_role)
  on conflict (partner_id, user_id)
  do update set role = excluded.role
  returning * into inserted_row;

  return inserted_row;
end;
$$;

-- Items represent marketplace entries shown after approval.
create table public.items (
  id bigint generated always as identity primary key,
  partner_id bigint not null references public.partners (id) on delete cascade,
  slug text not null unique,
  title text not null,
  summary text,
  content text, -- markdown body
  type public.marketplace_item_type not null,
  link text not null,
  submitted_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint items_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

-- Marketplace categories (e.g. auth, analytics, cms, etc).
create table public.categories (
  id bigint generated always as identity primary key,
  slug text not null unique,
  title text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

-- Many-to-many between categories and items.
create table public.category_items (
  category_id bigint not null references public.categories (id) on delete cascade,
  item_id bigint not null references public.items (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (category_id, item_id)
);

-- Files/assets for items (screenshots, logos, docs, etc).
create table public.item_files (
  id bigint generated always as identity primary key,
  item_id bigint not null references public.items (id) on delete cascade,
  file_path text not null,
  alt_text text,
  sort_order integer not null default 0,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Moderation fields are isolated here so partners cannot alter them.
create table public.item_reviews (
  item_id bigint primary key references public.items (id) on delete cascade,
  status public.marketplace_review_status not null default 'pending_review',
  featured boolean not null default false,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  review_notes text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep a single featured file per item.
create unique index item_files_one_featured_per_item_idx
  on public.item_files (item_id)
  where featured = true;

-- Helpful indexes for common read paths.
create index items_type_idx on public.items (type);
create index items_partner_id_idx on public.items (partner_id);
create index partner_members_user_id_idx on public.partner_members (user_id);
create index category_items_item_id_idx on public.category_items (item_id);
create index item_files_item_id_sort_order_idx on public.item_files (item_id, sort_order);
create index item_reviews_status_idx on public.item_reviews (status);
create index item_reviews_featured_idx on public.item_reviews (featured) where featured = true;

-- Row Level Security
alter table public.partners enable row level security;
alter table public.partner_members enable row level security;
alter table public.items enable row level security;
alter table public.categories enable row level security;
alter table public.category_items enable row level security;
alter table public.item_files enable row level security;
alter table public.item_reviews enable row level security;

-- Partners
create policy "partners_select"
  on public.partners
  for select
  using (
    public.is_supabase_team_member()
    or public.is_partner_member(id)
  );

create policy "partners_insert"
  on public.partners
  for insert
  with check (
    public.is_supabase_team_member()
    or (auth.uid() is not null and created_by = auth.uid())
  );

create policy "partners_update"
  on public.partners
  for update
  using (
    public.is_supabase_team_member()
    or public.is_partner_member(id)
  )
  with check (
    public.is_supabase_team_member()
    or public.is_partner_member(id)
  );

create policy "partners_delete"
  on public.partners
  for delete
  using (
    public.is_supabase_team_member()
    or public.is_partner_member(id)
  );

-- Partner members
create policy "partner_members_select"
  on public.partner_members
  for select
  using (
    public.is_supabase_team_member()
    or user_id = auth.uid()
    or public.is_partner_member(partner_id)
  );

create policy "partner_members_modify_supabase_only"
  on public.partner_members
  for all
  using (public.is_supabase_team_member())
  with check (public.is_supabase_team_member());

create policy "partner_members_insert_creator_as_admin"
  on public.partner_members
  for insert
  with check (
    user_id = auth.uid()
    and role = 'admin'
    and exists (
      select 1
      from public.partners p
      where p.id = partner_id
        and p.created_by = auth.uid()
    )
  );

create policy "partner_members_insert_admin"
  on public.partner_members
  for insert
  with check (
    public.is_partner_admin(partner_id)
    and role in ('member', 'admin')
  );

-- Items
create policy "items_select"
  on public.items
  for select
  using (
    public.is_supabase_team_member()
    or public.is_partner_member(partner_id)
    or public.is_reviewer_member()
  );

create policy "items_insert"
  on public.items
  for insert
  with check (
    public.is_supabase_team_member()
    or (
      public.is_partner_member(partner_id)
      and submitted_by = auth.uid()
    )
  );

create policy "items_update"
  on public.items
  for update
  using (
    public.is_supabase_team_member()
    or public.is_partner_member(partner_id)
  )
  with check (
    public.is_supabase_team_member()
    or public.is_partner_member(partner_id)
  );

create policy "items_delete"
  on public.items
  for delete
  using (
    public.is_supabase_team_member()
    or public.is_partner_member(partner_id)
  );

-- Categories: readable by anyone, writable by Supabase team.
create policy "categories_select_all"
  on public.categories
  for select
  using (true);

create policy "categories_modify_supabase_only"
  on public.categories
  for all
  using (public.is_supabase_team_member())
  with check (public.is_supabase_team_member());

-- Category item mappings: partner members can manage mappings for their own items.
create policy "category_items_select"
  on public.category_items
  for select
  using (
    public.is_supabase_team_member()
    or exists (
      select 1
      from public.items i
      where i.id = category_items.item_id
        and public.is_partner_member(i.partner_id)
    )
  );

create policy "category_items_insert"
  on public.category_items
  for insert
  with check (
    public.is_supabase_team_member()
    or exists (
      select 1
      from public.items i
      where i.id = category_items.item_id
        and public.is_partner_member(i.partner_id)
    )
  );

create policy "category_items_update"
  on public.category_items
  for update
  using (
    public.is_supabase_team_member()
    or exists (
      select 1
      from public.items i
      where i.id = category_items.item_id
        and public.is_partner_member(i.partner_id)
    )
  )
  with check (
    public.is_supabase_team_member()
    or exists (
      select 1
      from public.items i
      where i.id = category_items.item_id
        and public.is_partner_member(i.partner_id)
    )
  );

create policy "category_items_delete"
  on public.category_items
  for delete
  using (
    public.is_supabase_team_member()
    or exists (
      select 1
      from public.items i
      where i.id = category_items.item_id
        and public.is_partner_member(i.partner_id)
    )
  );

-- Item files
create policy "item_files_select"
  on public.item_files
  for select
  using (
    public.is_supabase_team_member()
    or exists (
      select 1
      from public.items i
      where i.id = item_files.item_id
        and public.is_partner_member(i.partner_id)
    )
  );

create policy "item_files_insert"
  on public.item_files
  for insert
  with check (
    public.is_supabase_team_member()
    or exists (
      select 1
      from public.items i
      where i.id = item_files.item_id
        and public.is_partner_member(i.partner_id)
    )
  );

create policy "item_files_update"
  on public.item_files
  for update
  using (
    public.is_supabase_team_member()
    or exists (
      select 1
      from public.items i
      where i.id = item_files.item_id
        and public.is_partner_member(i.partner_id)
    )
  )
  with check (
    public.is_supabase_team_member()
    or exists (
      select 1
      from public.items i
      where i.id = item_files.item_id
        and public.is_partner_member(i.partner_id)
    )
  );

create policy "item_files_delete"
  on public.item_files
  for delete
  using (
    public.is_supabase_team_member()
    or exists (
      select 1
      from public.items i
      where i.id = item_files.item_id
        and public.is_partner_member(i.partner_id)
    )
  );

-- Item reviews: partners can view their own status, reviewer partners can modify.
create policy "item_reviews_select"
  on public.item_reviews
  for select
  using (
    public.is_supabase_team_member()
    or public.is_reviewer_member()
    or exists (
      select 1
      from public.items i
      where i.id = item_reviews.item_id
        and public.is_partner_member(i.partner_id)
    )
  );

create policy "item_reviews_insert_reviewer"
  on public.item_reviews
  for insert
  with check (public.is_reviewer_member());

create policy "item_reviews_insert_partner_request"
  on public.item_reviews
  for insert
  with check (
    exists (
      select 1
      from public.items i
      where i.id = item_reviews.item_id
        and public.is_partner_member(i.partner_id)
    )
    and status = 'pending_review'
    and featured = false
    and reviewed_by is null
    and reviewed_at is null
    and review_notes is null
    and published_at is null
  );

create policy "item_reviews_update_reviewer"
  on public.item_reviews
  for update
  using (public.is_reviewer_member())
  with check (public.is_reviewer_member());

create policy "item_reviews_update_partner_request"
  on public.item_reviews
  for update
  using (
    exists (
      select 1
      from public.items i
      where i.id = item_reviews.item_id
        and public.is_partner_member(i.partner_id)
    )
  )
  with check (
    exists (
      select 1
      from public.items i
      where i.id = item_reviews.item_id
        and public.is_partner_member(i.partner_id)
    )
    and status = 'pending_review'
    and featured = false
    and reviewed_by is null
    and reviewed_at is null
    and review_notes is null
    and published_at is null
  );

create policy "item_reviews_delete_reviewer"
  on public.item_reviews
  for delete
  using (public.is_reviewer_member());

-- Column-level permissions: reviewer assignment is managed manually by service role.
revoke insert (reviewer) on table public.partners from anon, authenticated;
revoke update (reviewer) on table public.partners from anon, authenticated;
grant insert (reviewer) on table public.partners to service_role;
grant update (reviewer) on table public.partners to service_role;

revoke all on function public.add_partner_member(bigint, text, text) from public;
grant execute on function public.add_partner_member(bigint, text, text) to authenticated;
revoke all on function public.storage_object_partner_id(text) from public;
revoke all on function public.storage_object_item_id(text) from public;
grant execute on function public.storage_object_partner_id(text) to authenticated;
grant execute on function public.storage_object_item_id(text) to authenticated;

-- Storage policies for marketplace item files.
create policy "item_files_storage_select"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'item_files'
    and split_part(name, '/', 2) = 'items'
    and public.storage_object_partner_id(name) is not null
    and public.storage_object_item_id(name) is not null
    and exists (
      select 1
      from public.items i
      where i.id = public.storage_object_item_id(name)
        and i.partner_id = public.storage_object_partner_id(name)
        and public.is_partner_member(i.partner_id)
    )
  );

create policy "item_files_storage_insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'item_files'
    and split_part(name, '/', 2) = 'items'
    and public.storage_object_partner_id(name) is not null
    and public.storage_object_item_id(name) is not null
    and exists (
      select 1
      from public.items i
      where i.id = public.storage_object_item_id(name)
        and i.partner_id = public.storage_object_partner_id(name)
        and public.is_partner_member(i.partner_id)
    )
  );

create policy "item_files_storage_update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'item_files'
    and split_part(name, '/', 2) = 'items'
    and public.storage_object_partner_id(name) is not null
    and public.storage_object_item_id(name) is not null
    and exists (
      select 1
      from public.items i
      where i.id = public.storage_object_item_id(name)
        and i.partner_id = public.storage_object_partner_id(name)
        and public.is_partner_member(i.partner_id)
    )
  )
  with check (
    bucket_id = 'item_files'
    and split_part(name, '/', 2) = 'items'
    and public.storage_object_partner_id(name) is not null
    and public.storage_object_item_id(name) is not null
    and exists (
      select 1
      from public.items i
      where i.id = public.storage_object_item_id(name)
        and i.partner_id = public.storage_object_partner_id(name)
        and public.is_partner_member(i.partner_id)
    )
  );

create policy "item_files_storage_delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'item_files'
    and split_part(name, '/', 2) = 'items'
    and public.storage_object_partner_id(name) is not null
    and public.storage_object_item_id(name) is not null
    and exists (
      select 1
      from public.items i
      where i.id = public.storage_object_item_id(name)
        and i.partner_id = public.storage_object_partner_id(name)
        and public.is_partner_member(i.partner_id)
    )
  );
