-- Some predefined roles don't exist in earlier versions of Postgres, so we
-- exclude them in this test file. They're tested in version-specific test files
-- (z_<ver>_roles.sql).
--
-- Currently those roles are:
-- pg_create_subscription, pg_maintain, pg_use_reserved_connections

-- all roles and attributes
select
  rolname,
  rolcreaterole  ,
  rolcanlogin    ,
  rolsuper       ,
  rolinherit     ,
  rolcreatedb    ,
  rolreplication ,
  rolconnlimit   ,
  rolbypassrls   ,
  rolvaliduntil
from pg_roles r
where rolname not in ('pg_create_subscription', 'pg_maintain', 'pg_use_reserved_connections')
order by rolname;

select
  rolname,
  rolconfig
from pg_roles r
where rolname not in ('pg_create_subscription', 'pg_maintain', 'pg_use_reserved_connections')
order by rolname;

-- Check all privileges of the roles on the schemas
select schema_name, privilege_type, grantee, default_for
from (
    -- ALTER DEFAULT privileges on schemas
    select
        n.nspname as schema_name,
        a.privilege_type,
        r.rolname as grantee,
        d.defaclrole::regrole as default_for,
        case when n.nspname = 'public' then 0 else 1 end as schema_order
    from
        pg_default_acl d
    join
        pg_namespace n on d.defaclnamespace = n.oid
    cross join lateral aclexplode(d.defaclacl) as a
    join
        pg_roles r on a.grantee = r.oid
    where
        -- PG17+, handled in version-specific test files
        a.privilege_type != 'MAINTAIN'
    union all
    -- explicit grant usage and create on the schemas
    select
        n.nspname as schema_name,
        a.privilege_type,
        r.rolname as grantee,
        n.nspowner::regrole as default_for,
        case when n.nspname = 'public' then 0 else 1 end as schema_order
    from
        pg_namespace n
    cross join lateral aclexplode(n.nspacl) as a
    join
        pg_roles r on a.grantee = r.oid
    where
        a.privilege_type in ('CREATE', 'USAGE')
) sub
order by schema_order, schema_name, privilege_type, grantee, default_for;

-- postgres can alter API roles' timeout
set role postgres;
alter role anon set statement_timeout = '10min';

alter role anon reset statement_timeout;
reset role;
