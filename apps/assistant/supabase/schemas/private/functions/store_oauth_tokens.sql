create or replace function private.store_oauth_tokens(
  p_user_id uuid,
  p_org_slug text,
  p_access_token text,
  p_refresh_token text,
  p_expires_at timestamptz,
  p_scopes text[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing_secret_id uuid;
  new_secret_id uuid;
  secret_payload text;
  secret_name text;
begin
  secret_payload := json_build_object(
    'access_token', p_access_token,
    'refresh_token', p_refresh_token
  )::text;
  secret_name := format('oauth:%s:%s', p_user_id, p_org_slug);

  select oc.vault_secret_id
    into existing_secret_id
  from public.oauth_connections as oc
  where oc.user_id = p_user_id
    and oc.org_slug = p_org_slug;

  if existing_secret_id is not null then
    perform vault.update_secret(existing_secret_id, secret_payload);

    update public.oauth_connections
    set
      scopes = coalesce(p_scopes, '{}'::text[]),
      expires_at = p_expires_at,
      updated_at = now()
    where user_id = p_user_id
      and org_slug = p_org_slug;
  else
    new_secret_id := vault.create_secret(secret_payload, secret_name);

    insert into public.oauth_connections (
      user_id,
      org_slug,
      vault_secret_id,
      scopes,
      expires_at
    )
    values (
      p_user_id,
      p_org_slug,
      new_secret_id,
      coalesce(p_scopes, '{}'::text[]),
      p_expires_at
    );
  end if;
end;
$$;

revoke all on function private.store_oauth_tokens(uuid, text, text, text, timestamptz, text[]) from public;
grant execute on function private.store_oauth_tokens(uuid, text, text, text, timestamptz, text[]) to service_role;
