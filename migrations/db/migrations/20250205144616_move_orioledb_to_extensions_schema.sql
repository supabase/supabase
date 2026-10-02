-- migrate:up
do $$
declare
    ext_schema text;
    extensions_schema_exists boolean;
begin
    -- check if the "extensions" schema exists
    select exists (
        select 1 from pg_namespace where nspname = 'extensions'
    ) into extensions_schema_exists;

    if extensions_schema_exists then
        -- check if the "orioledb" extension is in the "public" schema
        select nspname into ext_schema
        from pg_extension e
        join pg_namespace n on e.extnamespace = n.oid
        where extname = 'orioledb';

        if ext_schema = 'public' then
            execute 'alter extension orioledb set schema extensions';
        end if;
    end if;
end $$;

-- migrate:down

