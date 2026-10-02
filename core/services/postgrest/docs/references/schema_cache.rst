.. _schema_cache:

Schema Cache
============

PostgREST requires metadata from the database to provide a REST API that abstracts SQL details. One example of this is the interface for :ref:`resource_embedding`.

Getting this metadata requires expensive queries. To avoid repeating this work, PostgREST uses a schema cache.

.. note::

  - Schema cache queries have been optimized over time to stay fast, even on complex databases. You can see a summary of their execution time in :ref:`pgrst_logging` and :ref:`metrics`.
  - If the schema cache queries are slow, the most likely cause is *system catalog bloat*, see `issue#3212 <https://github.com/PostgREST/postgrest/issues/3212>`_ for more details.
  - You can turn the :ref:`log-level` to ``debug`` to see the time of each schema cache query.

.. _schema_reloading:

Schema Cache Reloading
----------------------

To not let the schema cache go stale (happens when you make changes to the database), you need to reload it.

You can do this with UNIX signals or with PostgreSQL notifications. It's also possible to do this automatically using `event triggers <https://www.postgresql.org/docs/current/event-trigger-definition.html>`_.

.. note::

  - If the schema cache fails to reload (e.g. due to a ``statement_timeout`` or :ref:`pool timeout <pool_timeout>`), PostgREST will continue serving requests in a "best effort" basis.
  - If you are using the :ref:`in_db_config`, a schema cache reload will :ref:`reload the configuration<config_reloading>` as well.

.. _schema_reloading_signals:

Schema Cache Reloading with Unix Signals
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

To manually reload the cache without restarting the PostgREST server, send a SIGUSR1 signal to the server process.

.. code:: bash

  killall -SIGUSR1 postgrest


For docker you can do:

.. code:: bash

  docker kill -s SIGUSR1 <container>

  # or in docker-compose
  docker-compose kill -s SIGUSR1 <service>

.. _schema_reloading_notify:

Schema Cache Reloading with NOTIFY
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

To reload the schema cache from within the database, you can use the ``NOTIFY`` command. See :ref:`listener`.

.. code-block:: postgres

  NOTIFY pgrst, 'reload schema'

Debouncing
~~~~~~~~~~

PostgREST does not reload the schema cache for each notification when several ``NOTIFY pgrst`` events are generated quickly after one another.

There are two cases to consider: when notifications are sent within a single transaction and when they are sent across multiple transactions.

In the first case, PostgreSQL deduplicates identical ``NOTIFY`` events within the same transaction. This means that even if multiple ``NOTIFY pgrst`` statements are executed before a ``COMMIT``, only a single notification is delivered to PostgREST.

In the second case, when notifications are sent from separate transactions in a short time span, PostgREST applies a debouncing mechanism to avoid excessive schema cache reloads.

Instead of reloading the schema cache for each notification, events are grouped within a small time window of 100 milliseconds. The reload function is executed once immediately when the first notification is received and once more after the burst of events settles, resulting in at most two executions within that time window.

.. _auto_schema_reloading:

Automatic Schema Cache Reloading
--------------------------------

You can do automatic reloading and forget there is a schema cache. For this use an `event trigger <https://www.postgresql.org/docs/current/event-trigger-definition.html>`_ and ``NOTIFY``.

.. code-block:: postgres

  -- Create an event trigger function
  CREATE OR REPLACE FUNCTION pgrst_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
    NOTIFY pgrst, 'reload schema';
  END;
  $$;

  -- This event trigger will fire after every ddl_command_end event
  CREATE EVENT TRIGGER pgrst_watch
    ON ddl_command_end
    EXECUTE PROCEDURE pgrst_watch();

Now, whenever the ``pgrst_watch`` trigger fires, PostgREST will auto-reload the schema cache.

To disable auto reloading, drop the trigger.

.. code-block:: postgres

  DROP EVENT TRIGGER pgrst_watch

Finer-Grained Event Trigger
~~~~~~~~~~~~~~~~~~~~~~~~~~~

You can refine the previous event trigger to only react to the events relevant to the schema cache. This also prevents unnecessary
reloading when creating temporary tables inside functions.

.. code-block:: postgres

  -- watch CREATE and ALTER
  CREATE OR REPLACE FUNCTION pgrst_ddl_watch() RETURNS event_trigger AS $$
  DECLARE
    cmd record;
  BEGIN
    FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
    LOOP
      IF cmd.command_tag IN (
        'CREATE SCHEMA', 'ALTER SCHEMA'
      , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
      , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
      , 'CREATE VIEW', 'ALTER VIEW'
      , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
      , 'CREATE FUNCTION', 'ALTER FUNCTION'
      , 'CREATE TRIGGER'
      , 'CREATE TYPE', 'ALTER TYPE'
      , 'CREATE RULE'
      , 'COMMENT'
      )
      -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
      AND cmd.schema_name is distinct from 'pg_temp'
      THEN
        NOTIFY pgrst, 'reload schema';
      END IF;
    END LOOP;
  END; $$ LANGUAGE plpgsql;

  -- watch DROP
  CREATE OR REPLACE FUNCTION pgrst_drop_watch() RETURNS event_trigger AS $$
  DECLARE
    obj record;
  BEGIN
    FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
    LOOP
      IF obj.object_type IN (
        'schema'
      , 'table'
      , 'foreign table'
      , 'view'
      , 'materialized view'
      , 'function'
      , 'trigger'
      , 'type'
      , 'rule'
      )
      AND obj.is_temporary IS false -- no pg_temp objects
      THEN
        NOTIFY pgrst, 'reload schema';
      END IF;
    END LOOP;
  END; $$ LANGUAGE plpgsql;

  CREATE EVENT TRIGGER pgrst_ddl_watch
    ON ddl_command_end
    EXECUTE PROCEDURE pgrst_ddl_watch();

  CREATE EVENT TRIGGER pgrst_drop_watch
    ON sql_drop
    EXECUTE PROCEDURE pgrst_drop_watch();
