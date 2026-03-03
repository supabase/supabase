---
id: 'postgres-event-triggers'
title: 'Event Triggers'
description: 'Automatically execute SQL on database events.'
subtitle: 'Automatically execute SQL on database events.'
---

In Postgres, an [event trigger](https://www.postgresql.org/docs/current/event-triggers.html) is similar to a [trigger](/docs/guides/database/postgres/triggers), except that it is triggered by database level events (and is usually reserved for [superusers](/docs/guides/database/postgres/roles-superuser))

With our `Supautils` extension (installed automatically for all Supabase projects), the `postgres` user has the ability to create and manage event triggers.

Some use cases for event triggers are:

- Capturing Data Definition Language (DDL) changes - these are changes to your database schema (though the [pgAudit](/docs/guides/database/extensions/pgaudit) extension provides a more complete solution)
- Enforcing/monitoring/preventing actions - such as preventing tables from being dropped in Production or enforcing RLS on all new tables

The guide covers two example event triggers:

1. Preventing accidental dropping of a table
2. Automatically enabling Row Level Security on new tables in the `public` schema

## Creating an event trigger

Only the `postgres` user can create event triggers, so make sure you are authenticated as them. As with triggers, event triggers consist of 2 parts

1. A [Function](/docs/guides/database/functions) which will be executed when the triggering event occurs
2. The actual Event Trigger object, with parameters around when the trigger should be run

### Example trigger function - prevent dropping tables

This example protects any table from being dropped. You can override it by temporarily disabling the event trigger: `ALTER EVENT TRIGGER dont_drop_trigger DISABLE;`

```sql
-- Function
CREATE OR REPLACE FUNCTION dont_drop_function()
  RETURNS event_trigger LANGUAGE plpgsql AS $$
DECLARE
    obj record;
    tbl_name text;
BEGIN
    FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
    LOOP
        IF obj.object_type = 'table' THEN
            RAISE EXCEPTION 'ERROR: All tables in this schema are protected and cannot be dropped';
        END IF;
    END LOOP;
END;
$$;

-- Event trigger
CREATE EVENT TRIGGER dont_drop_trigger
ON sql_drop
EXECUTE FUNCTION dont_drop_function();
```

### Example trigger function - auto enable Row Level Security

See how to [auto enable RLS for new tables](/docs/guides/database/postgres/row-level-security#auto-enable-rls-for-new-tables).

### Event trigger Functions and firing events

Event triggers can be triggered on:

- `ddl_command_start` - occurs just before a DDL command for almost all objects within a schema
- `ddl_command_end` - occurs just after a DDL command for almost all objects within a schema
- `sql_drop` - occurs just before `ddl_command_end` for any DDL commands that `DROP` a database object (note that altering a table can cause it to be dropped)
- `table_rewrite` - occurs just before a table is rewritten using the `ALTER TABLE` command

<Admonition type="caution">

Event triggers run for each DDL command specified above and can consume resources which may cause performance issues if not used carefully.

</Admonition>

Within each event trigger, helper functions exist to view the objects being modified or the command being run. For example, our example calls `pg_event_trigger_dropped_objects()` to view the object(s) being dropped. For a more comprehensive overview of these functions, read the [official event trigger definition documentation](https://www.postgresql.org/docs/current/event-trigger-definition.html)

To view the matrix commands that cause an event trigger to fire, read the [official event trigger matrix documentation](https://www.postgresql.org/docs/17/event-trigger-matrix.html)

## Disabling an event trigger

You can disable an event trigger using the `alter event trigger` command:

```sql
ALTER EVENT TRIGGER dont_drop_trigger DISABLE;
```

## Dropping an event trigger

You can delete a trigger using the `drop event trigger` command:

```sql
DROP EVENT TRIGGER dont_drop_trigger;
```

## Resources

- Official Postgres Docs: [Event Trigger Behaviours](https://www.postgresql.org/docs/current/event-trigger-definition.html)
- Official Postgres Docs: [Event Trigger Firing Matrix](https://www.postgresql.org/docs/17/event-trigger-matrix.html)
- Supabase blog: [Postgres Event Triggers without superuser access](/blog/event-triggers-wo-superuser)
