-- version-specific roles and attributes
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
where rolname in ('pg_create_subscription', 'pg_maintain', 'pg_use_reserved_connections')
order by rolname;

select
  rolname,
  rolconfig
from pg_roles r
where rolname in ('pg_create_subscription', 'pg_maintain', 'pg_use_reserved_connections')
order by rolname;

-- version-specific role memberships
select
    r.rolname as member,
    g.rolname as "member_of (can become)",
    m.admin_option
from
    pg_roles r
join
    pg_auth_members m on r.oid = m.member
left join
    pg_roles g on m.roleid = g.oid
order by
    r.rolname, g.rolname;

-- Check version-specific privileges of the roles on the schemas
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
        a.privilege_type = 'MAINTAIN'
) sub
order by schema_order, schema_name, privilege_type, grantee, default_for;

-- version specific role memberships
select
    r.rolname as member,
    g.rolname as "member_of (can become)",
    m.admin_option
from
    pg_roles r
left join
    pg_auth_members m on r.oid = m.member
left join
    pg_roles g on m.roleid = g.oid
where r.rolname not in ('pg_create_subscription', 'pg_maintain', 'pg_use_reserved_connections')
and g.rolname not in ('pg_create_subscription', 'pg_maintain', 'pg_use_reserved_connections')
order by
    r.rolname, g.rolname;

-- Check all privileges of non-superuser roles on functions
select
  p.pronamespace::regnamespace as schema,
  p.proname as object_name,
  acl.grantee::regrole::text as grantee,
  acl.privilege_type
from pg_catalog.pg_proc p
cross join lateral pg_catalog.aclexplode(p.proacl) as acl
where p.pronamespace::regnamespace::text = 'pg_catalog'
  and acl.grantee::regrole::text != 'supabase_admin'
order by object_name, grantee, privilege_type;
