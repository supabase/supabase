do $$
declare
  extoid oid := (select oid from pg_extension where extname = 'pgmq');
  extversion text := (select extversion from pg_extension where extname = 'pgmq');
  search_path text := (select current_setting('search_path'));
  r record;
  cls pg_class%rowtype;
begin
  perform set_config('search_path', '', true);

/*
    Override the pgmq.drop_queue to check if relevant tables are owned
    by the pgmq extension before attempting to run
    `alter extension pgmq drop table ...`
    this is necessary becasue, to enable nightly logical backups to include user queues
    we automatically detach them from pgmq.

    this update is backwards compatible with version 1.4.4 but should be removed once we're on
    physical backups everywhere
*/
-- Detach and delete the official function
if extversion = '1.4.4' then
  alter extension pgmq drop function pgmq.drop_queue;
  drop function pgmq.drop_queue;
else -- 1.5.1+
  alter extension pgmq drop function pgmq.drop_queue(TEXT);
  drop function pgmq.drop_queue(TEXT);
end if;

-- Create and reattach the patched function
CREATE FUNCTION pgmq.drop_queue(queue_name TEXT)
RETURNS BOOLEAN AS $func$
DECLARE
    qtable TEXT := pgmq.format_table_name(queue_name, 'q');
    qtable_seq TEXT := qtable || '_msg_id_seq';
    fq_qtable TEXT := 'pgmq.' || qtable;
    atable TEXT := pgmq.format_table_name(queue_name, 'a');
    fq_atable TEXT := 'pgmq.' || atable;
    partitioned BOOLEAN;
BEGIN
    EXECUTE FORMAT(
        $QUERY$
        SELECT is_partitioned FROM pgmq.meta WHERE queue_name = %L
        $QUERY$,
        queue_name
    ) INTO partitioned;

    -- NEW CONDITIONAL CHECK
    if exists (
        select 1
        from pg_class c
        join pg_depend d on c.oid = d.objid
        join pg_extension e on d.refobjid = e.oid
        where c.relname = qtable and e.extname = 'pgmq'
    ) then

        EXECUTE FORMAT(
            $QUERY$
            ALTER EXTENSION pgmq DROP TABLE pgmq.%I
            $QUERY$,
            qtable
        );

    end if;

    -- NEW CONDITIONAL CHECK
    if exists (
        select 1
        from pg_class c
        join pg_depend d on c.oid = d.objid
        join pg_extension e on d.refobjid = e.oid
        where c.relname = qtable_seq and e.extname = 'pgmq'
    ) then    
        EXECUTE FORMAT(
            $QUERY$
            ALTER EXTENSION pgmq DROP SEQUENCE pgmq.%I
            $QUERY$,
            qtable_seq
        );

    end if;

    -- NEW CONDITIONAL CHECK
    if exists (
        select 1
        from pg_class c
        join pg_depend d on c.oid = d.objid
        join pg_extension e on d.refobjid = e.oid
        where c.relname = atable and e.extname = 'pgmq'
    ) then

    EXECUTE FORMAT(
        $QUERY$
        ALTER EXTENSION pgmq DROP TABLE pgmq.%I
        $QUERY$,
        atable
    );

    end if;

    -- NO CHANGES PAST THIS POINT

    EXECUTE FORMAT(
        $QUERY$
        DROP TABLE IF EXISTS pgmq.%I
        $QUERY$,
        qtable
    );

    EXECUTE FORMAT(
        $QUERY$
        DROP TABLE IF EXISTS pgmq.%I
        $QUERY$,
        atable
    );

     IF EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_name = 'meta' and table_schema = 'pgmq'
     ) THEN
        EXECUTE FORMAT(
            $QUERY$
            DELETE FROM pgmq.meta WHERE queue_name = %L
            $QUERY$,
            queue_name
        );
     END IF;

     IF partitioned THEN
        EXECUTE FORMAT(
          $QUERY$
          DELETE FROM %I.part_config where parent_table in (%L, %L)
          $QUERY$,
          pgmq._get_pg_partman_schema(), fq_qtable, fq_atable
        );
     END IF;

    RETURN TRUE;
END;
$func$ LANGUAGE plpgsql;

if extversion = '1.4.4' then
  alter extension pgmq add function pgmq.drop_queue;
else -- 1.5.1+
  alter extension pgmq add function pgmq.drop_queue(TEXT);
end if;


  update pg_extension set extowner = 'postgres'::regrole where extname = 'pgmq';

  for r in (select * from pg_depend where refobjid = extoid) loop


    if r.classid = 'pg_type'::regclass then

      -- store the type's relkind
      select * into cls from pg_class c where c.reltype = r.objid;

      if r.objid::regtype::text like '%[]' then
        -- do nothing (skipping array type)

      elsif cls.relkind in ('r', 'p', 'f', 'm') then
        -- table-like objects (regular table, partitioned, foreign, materialized view)
        execute format('alter table pgmq.%I owner to postgres;', cls.relname);

      else
        execute(format('alter type %s owner to postgres;', r.objid::regtype));

      end if;

    elsif r.classid = 'pg_proc'::regclass then
      execute(format('alter function %s(%s) owner to postgres;', r.objid::regproc, pg_get_function_identity_arguments(r.objid)));

    elsif r.classid = 'pg_class'::regclass then
      execute(format('alter table %s owner to postgres;', r.objid::regclass));

    else
      raise exception 'error on pgmq after-create script: unexpected object type %', r.classid;

    end if;
  end loop;

  -- restore configs
  perform set_config('search_path', search_path, true);
end $$;
