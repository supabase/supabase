CREATE OR REPLACE FUNCTION public.ipv6_active_status (
  project_ref text
)
  RETURNS TABLE (
    pgbouncer_active boolean,
    vercel_active    boolean
  )
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  pgbouncer_active boolean;
  vercel_active boolean;
begin
  select exists (
    select 1 
    from public.active_pgbouncer_projects ap
    where ap.project_ref = $1
  ) into pgbouncer_active;

  select exists (
    select 1
    from public.vercel_project_connections_without_supavisor vp
    where vp.project_ref = $1
  ) into vercel_active;

  return query select pgbouncer_active, vercel_active;
end;
$function$;

GRANT EXECUTE ON FUNCTION "public"."ipv6_active_status"(text) TO PUBLIC, "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."ipv6_active_status"(text) TO "service_role";

REVOKE ALL ON FUNCTION "public"."ipv6_active_status"(text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."ipv6_active_status"(text) TO "postgres";
