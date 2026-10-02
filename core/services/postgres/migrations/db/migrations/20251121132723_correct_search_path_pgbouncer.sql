-- migrate:up

create or replace function pgbouncer.get_auth(p_usename text) returns table (username text, password text)
    language plpgsql 
    set search_path = ''
    security definer
    as $$
begin
    raise debug 'PgBouncer auth request: %', p_usename;

    return query
    select 
        rolname::text, 
        case when rolvaliduntil < now() 
            then null 
            else rolpassword::text 
        end 
    from pg_authid 
    where rolname=$1 and rolcanlogin;
end;
$$;

revoke all on function pgbouncer.get_auth(text) from public;
revoke execute on function pgbouncer.get_auth(text) from postgres;
grant execute on function pgbouncer.get_auth(text) to pgbouncer;
-- migrate:down

