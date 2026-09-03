create or replace function private.read_oauth_tokens(p_user_id uuid, p_org_slug text)
returns table (
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  scopes text[],
  vault_secret_id uuid
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    (ds.decrypted_secret::json ->> 'access_token'),
    (ds.decrypted_secret::json ->> 'refresh_token'),
    oc.expires_at,
    oc.scopes,
    oc.vault_secret_id
  from public.oauth_connections as oc
  join vault.decrypted_secrets as ds
    on ds.id = oc.vault_secret_id
  where oc.user_id = p_user_id
    and oc.org_slug = p_org_slug;
$$;

revoke all on function private.read_oauth_tokens(uuid, text) from public;
grant execute on function private.read_oauth_tokens(uuid, text) to service_role;
