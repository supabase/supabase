-- all role memberships
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
