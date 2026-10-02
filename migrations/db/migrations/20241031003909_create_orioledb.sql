-- migrate:up
do $$ 
begin 
    if exists (select 1 from pg_available_extensions where name = 'orioledb') then
        if not exists (select 1 from pg_extension where extname = 'orioledb') then
            create extension if not exists orioledb;
        end if;
    end if;
end $$;

-- migrate:down
