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
