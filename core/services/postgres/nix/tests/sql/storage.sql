-- storage schema owner
select
  n.nspname as schema_name,
  r.rolname as owner
from
  pg_namespace n
join
  pg_roles r on n.nspowner = r.oid
where
  n.nspname = 'storage';

-- storage schema tables with owners and rls policies
select
  ns.nspname as schema_name,
  c.relname as table_name,
  r.rolname as owner,
  c.relrowsecurity as rls_enabled,
  string_agg(p.polname, ', ' order by p.polname) as rls_policies
from
  pg_class c
join
  pg_namespace ns on c.relnamespace = ns.oid
join
  pg_roles r on c.relowner = r.oid
left join
  pg_policy p on p.polrelid = c.oid
where
  ns.nspname = 'storage'
  and c.relkind = 'r'
group by
  ns.nspname, c.relname, r.rolname, c.relrowsecurity
order by
  c.relname;

-- storage schema objects with roles privileges
select
  ns.nspname    as schema_name,
  c.relname     as table_name,
  r.rolname     as role_name,
  a.privilege_type,
  a.is_grantable
from
  pg_class      c
join
  pg_namespace  ns  on c.relnamespace = ns.oid
cross join lateral
  aclexplode(c.relacl) as a
join
  pg_roles      r   on a.grantee = r.oid
where
  ns.nspname = 'storage'
  and c.relkind in ('r', 'v', 'm')
  and a.privilege_type <> 'MAINTAIN'
order by
  c.relname,
  r.rolname,
  a.privilege_type;

-- storage indexes with owners
select
  ns.nspname as table_schema,
  t.relname as table_name,
  i.relname as index_name,
  r.rolname as index_owner
from
  pg_class t
join
  pg_namespace ns on t.relnamespace = ns.oid
join
  pg_index idx on t.oid = idx.indrelid
join
  pg_class i on idx.indexrelid = i.oid
join
  pg_roles r on i.relowner = r.oid
where
  ns.nspname = 'storage'
order by
  t.relname, i.relname;

-- storage schema functions with owners
select
  n.nspname as schema_name,
  p.proname as function_name,
  r.rolname as owner
from
  pg_proc p
join
  pg_namespace n on p.pronamespace = n.oid
join
  pg_roles r on p.proowner = r.oid
where
  n.nspname = 'storage'
order by
  p.proname;

-- postgres can grant storage privileges to custom roles
create role r;
grant r to postgres with admin option;

set role postgres;
grant usage on schema storage to r;
select pg_catalog.has_schema_privilege('r', 'storage', 'usage');

set role postgres;
drop owned by r cascade;
drop role r;
reset role;
