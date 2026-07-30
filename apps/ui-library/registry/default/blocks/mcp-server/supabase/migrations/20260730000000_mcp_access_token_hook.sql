-- MCP server — custom access-token hook
--
-- Supabase Auth calls this function when it issues an access token. Ordinary
-- sessions pass through unchanged. OAuth sessions get the MCP resource URL added
-- to the token's `aud` claim, which binds the token to this server so a token
-- minted for another purpose cannot be replayed against it. The server's
-- OAuth-mode auth requires that binding.
--
-- Enable it in supabase/config.toml under [auth.hook.custom_access_token]. That
-- applies to the local stack on `supabase start`, and to a linked project with
-- `supabase config push`. No dashboard toggle is needed.

create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to supabase_auth_admin;

create or replace function private.mcp_custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  claims jsonb;
  issuer text;
  resource_url text;
begin
  claims := event -> 'claims';

  -- Only OAuth sessions carry a client_id, and only they are MCP credentials.
  if claims is null or nullif(claims ->> 'client_id', '') is null then
    return event;
  end if;

  issuer := nullif(claims ->> 'iss', '');
  if issuer is null or issuer !~ '/auth/v1/?$' then
    return event;
  end if;

  resource_url := regexp_replace(issuer, '/auth/v1/?$', '')
    || '/functions/v1/mcp-server';

  claims := jsonb_set(
    claims,
    '{aud}',
    jsonb_build_array('authenticated', resource_url),
    true
  );

  return jsonb_set(event, '{claims}', claims, true);
end;
$$;

revoke all on function private.mcp_custom_access_token_hook(jsonb) from public, anon, authenticated;
grant execute on function private.mcp_custom_access_token_hook(jsonb) to supabase_auth_admin;
