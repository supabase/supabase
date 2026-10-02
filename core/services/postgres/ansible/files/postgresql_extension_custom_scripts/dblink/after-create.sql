do $$
declare
  r record;
begin
  for r in (select oid, (aclexplode(proacl)).grantee from pg_proc where proname = 'dblink_connect_u') loop
   continue when r.grantee = 'supabase_admin'::regrole;
   execute(
     format(
       'revoke all on function %s(%s) from %s;', r.oid::regproc, pg_get_function_identity_arguments(r.oid), r.grantee::regrole
     )
   );
  end loop;
end
$$;
