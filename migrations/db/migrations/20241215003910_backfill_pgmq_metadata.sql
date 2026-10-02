-- migrate:up
do $$
begin
    -- Check if the pgmq.meta table exists
    if exists (
        select
            1
        from
            pg_catalog.pg_class c
        join pg_catalog.pg_namespace n
            on c.relnamespace = n.oid
        where
            n.nspname = 'pgmq'
            and c.relname = 'meta'
            and c.relkind = 'r' -- regular table
            -- Make sure only expected columns exist and are correctly named
            and (
                select array_agg(attname::text order by attname)
                from pg_catalog.pg_attribute a
                where
                a.attnum > 0
                and a.attrelid = c.oid 
            ) = array['created_at', 'is_partitioned', 'is_unlogged', 'queue_name']::text[]
    ) then
        -- Insert data into pgmq.meta for all tables matching the naming pattern 'pgmq.q_<queue_name>'
        insert into pgmq.meta (queue_name, is_partitioned, is_unlogged, created_at)
        select
            substring(c.relname from 3) as queue_name,
            false as is_partitioned,
            case when c.relpersistence = 'u' then true else false end as is_unlogged,
            now() as created_at
        from
			pg_catalog.pg_class c
        	join pg_catalog.pg_namespace n
				on c.relnamespace = n.oid
        where
            n.nspname = 'pgmq'
            and c.relname like 'q_%'
            and c.relkind in ('r', 'p', 'u')
        on conflict (queue_name) do nothing;
    end if;
end $$;

-- For logical backups we detach the queue and archive tables from the pgmq extension
-- prior to pausing. Once detached, pgmq.drop_queue breaks. This re-attaches them 
-- when a project is unpaused and allows pgmq.drop_queue to work normally.
do $$
declare
    ext_exists boolean;
    tbl record;
begin
    -- check if pgmq extension is installed
    select exists(select 1 from pg_extension where extname = 'pgmq') into ext_exists;

    if ext_exists then
        for tbl in
            select c.relname as table_name
            from pg_class c
            join pg_namespace n on c.relnamespace = n.oid
            where n.nspname = 'pgmq'
              and c.relkind in ('r', 'u')  -- include ordinary and unlogged tables
              and (c.relname like 'q\_%' or c.relname like 'a\_%')
              and c.oid not in (
                  select d.objid
                  from pg_depend d
                  join pg_extension e on d.refobjid = e.oid
                  where e.extname = 'pgmq'
                    and d.classid = 'pg_class'::regclass
                    and d.deptype = 'e'
              )
        loop
            execute format('alter extension pgmq add table pgmq.%I', tbl.table_name);
        end loop;
    end if;
end;
$$;


-- migrate:down
