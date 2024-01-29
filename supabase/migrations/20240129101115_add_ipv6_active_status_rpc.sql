create
or replace function ipv6_active_status (project_ref text) returns table (pgbouncer_active boolean, vercel_active boolean) as $$
declare
  pgbouncer_active boolean;
  vercel_active boolean;
begin
  select exists(1) into pgbouncer_active
  from active_pgbouncer_projects
  where project_ref = $1;

  select exists(1) into vercel_active
  from vercel_project_connections_without_supavisor
  where project_ref = $1;

  return query select pgbouncer_active, vercel_active;
end;
$$ language plpgsql security definer;