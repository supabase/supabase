export const FUNCTION_PRIVILEGES_SQL = /* SQL */ `
select
  p.oid as function_id,
  n.nspname as schema,
  p.proname as name,
  pg_get_function_identity_arguments(p.oid) as identity_argument_types,
  coalesce(
    (
      select
        jsonb_agg(
          jsonb_build_object(
            'grantor',
            grantor::regrole::text,
            'grantee',
            case
              when grantee = '0' then 'public'
              else grantee::regrole::text
            end,
            'privilege_type',
            privilege_type,
            'is_grantable',
            is_grantable
          )
        )
      from
        aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) as acl (grantor, grantee, privilege_type, is_grantable)
    ),
    '[]'::jsonb
  ) as privileges
from
  pg_proc p
  join pg_namespace n on p.pronamespace = n.oid
where
  p.prokind = 'f'
  and n.nspname not in ('pg_catalog', 'information_schema')
`
