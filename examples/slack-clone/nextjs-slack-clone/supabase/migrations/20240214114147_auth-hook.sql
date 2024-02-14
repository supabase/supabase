-- Enable the "plv8" extension
-- https://supabase.com/docs/guides/database/extensions/plv8?database-method=sql#enable-the-extension
create extension plv8;

-- Create the auth hook function
-- https://supabase.com/docs/guides/auth/auth-hooks?language=add-metadata-claim-plv8#hook-custom-access-token
create or replace function custom_access_token_hook(event jsonb)
returns jsonb
language plv8
as $$
  var user_role;

  // Fetch the current user's user_role from the public user_roles table.
  var result = plv8.execute("select role from public.user_roles where user_id = $1", [event.user_id]);
  if (result.length > 0) {
    user_role = result[0].role;
  } else {
    // Assign null
    user_role = null;
  }

  // Check if 'claims' exists in the event object; if not, initialize it
  if (!event.claims) {
    event.claims = {};
  }
  if (!event.claims.app_metadata) {
    event.claims.app_metadata = {};
  }

  // Update the level in the claims
  event.claims.app_metadata.user_role = user_role;

  return event;
$$;

grant usage on schema public to supabase_auth_admin;

grant execute
  on function public.custom_access_token_hook
  to supabase_auth_admin;

revoke execute
  on function public.custom_access_token_hook
  from authenticated, anon;

grant all
  on table public.user_roles
to supabase_auth_admin;

revoke all
  on table public.user_roles
  from authenticated, anon;

create policy "Allow auth admin to read user roles" ON public.user_roles
as permissive for select
to supabase_auth_admin
using (true)
