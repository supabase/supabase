-- migrate:up
alter function pgbouncer.get_auth owner to supabase_admin;
grant execute on function pgbouncer.get_auth(p_usename text) to postgres;

-- migrate:down
