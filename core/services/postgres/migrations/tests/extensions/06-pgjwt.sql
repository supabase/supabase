BEGIN;
do $$ 
begin 
    if exists (select 1 from pg_available_extensions where name = 'pgjwt') then
        if not exists (select 1 from pg_extension where extname = 'pgjwt') then
            create extension if not exists pgjwt with schema "extensions" cascade;
        end if;
    end if;
end $$;
ROLLBACK;
