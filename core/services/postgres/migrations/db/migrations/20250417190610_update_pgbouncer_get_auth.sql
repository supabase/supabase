-- migrate:up

create or replace function pgbouncer.get_auth(p_usename text) returns table (username text, password text)
    language plpgsql security definer
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

-- from migrations/db/migrations/20250312095419_pgbouncer_ownership.sql
grant execute on function pgbouncer.get_auth(p_usename text) to postgres;

-- migrate:down
