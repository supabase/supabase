-- MCP server — custom access-token hook
--
-- Supabase Auth calls this function when it issues an access token. OAuth
-- sessions get the MCP resource URL added to the token's existing `aud` claim,
-- which binds the token to this server so a token minted for another purpose
-- cannot be replayed against it.
--
-- Enable it in supabase/config.toml under [auth.hook.custom_access_token]. That
-- applies to the local stack on `supabase start`, and to a linked project with
-- `supabase config push`. No dashboard toggle is needed.

create schema if not exists supabase_mcp;

revoke all on schema supabase_mcp from public;
grant usage on schema supabase_mcp to supabase_auth_admin;

create or replace function supabase_mcp.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  claims jsonb;
  audiences jsonb;
  issuer text;
  resource_url text;
begin
  claims := event -> 'claims';

  -- Only OAuth sessions carry a client_id, and only they are MCP credentials.
  if claims is null or nullif(claims ->> 'client_id', '') is null then
    return jsonb_build_object('claims', claims);
  end if;

  issuer := nullif(claims ->> 'iss', '');
  if issuer is null or issuer !~ '/auth/v1/?$' then
    return jsonb_build_object('claims', claims);
  end if;

  resource_url := regexp_replace(issuer, '/auth/v1/?$', '')
    || '/functions/v1/mcp-server';

  audiences := claims -> 'aud';
  if jsonb_typeof(audiences) = 'string' then
    audiences := jsonb_build_array(audiences);
  elsif jsonb_typeof(audiences) is distinct from 'array' then
    audiences := '[]'::jsonb;
  end if;

  if not audiences @> jsonb_build_array('authenticated') then
    audiences := audiences || jsonb_build_array('authenticated');
  end if;
  if not audiences @> jsonb_build_array(resource_url) then
    audiences := audiences || jsonb_build_array(resource_url);
  end if;

  claims := jsonb_set(claims, '{aud}', audiences, true);

  return jsonb_build_object('claims', claims);
end;
$$;

revoke all on function supabase_mcp.custom_access_token_hook(jsonb)
  from public, anon, authenticated;
grant execute on function supabase_mcp.custom_access_token_hook(jsonb) to supabase_auth_admin;
