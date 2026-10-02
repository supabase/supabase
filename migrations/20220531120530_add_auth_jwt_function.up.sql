-- add auth.jwt function

comment on function {{ index .Options "Namespace" }}.uid() is 'Deprecated. Use auth.jwt() -> ''sub'' instead.';
comment on function {{ index .Options "Namespace" }}.role() is 'Deprecated. Use auth.jwt() -> ''role'' instead.';
comment on function {{ index .Options "Namespace" }}.email() is 'Deprecated. Use auth.jwt() -> ''email'' instead.';

create or replace function {{ index .Options "Namespace" }}.jwt()
returns jsonb
language sql stable
as $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;
