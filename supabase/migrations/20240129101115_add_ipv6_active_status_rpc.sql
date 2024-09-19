create
or replace function ipv6_active_status (project_ref text) returns table (pgbouncer_active boolean, vercel_active boolean) as $$
declare
  pgbouncer_active boolean;
  vercel_active boolean;
begin
  select exists (
    select 1 
    from active_pgbouncer_projects ap
    where ap.project_ref = $1
  ) into pgbouncer_active;

  select exists (
    select 1
    from vercel_project_connections_without_supavisor vp
    where vp.project_ref = $1
  ) into vercel_active;

  return query select pgbouncer_active, vercel_active;
end;
$$ language plpgsql security definer;