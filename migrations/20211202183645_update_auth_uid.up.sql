-- update auth.uid()

create or replace function {{ index .Options "Namespace" }}.uid()
returns uuid
language sql stable
as $$
  select
  nullif(
    coalesce(
      current_setting('request.jwt.claim.sub', true),
      (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
    ),
    ''
  )::uuid
$$;
