alter table "public"."active_pgbouncer_projects" drop constraint "active_pgbouncer_projects_pkey";
alter table "public"."vercel_project_connections_without_supavisor" drop constraint "vercel_project_connections_without_supavisor_pkey";
drop index if exists "public"."active_pgbouncer_projects_pkey";
drop index if exists "public"."vercel_project_connections_without_supavisor_pkey";
drop table "public"."active_pgbouncer_projects";
drop table "public"."vercel_project_connections_without_supavisor";