.. _listener:

Listener
########

PostgREST uses `LISTEN <https://www.postgresql.org/docs/current/sql-listen.html>`_ to reload its :ref:`Schema Cache <schema_reloading_notify>` and :ref:`Configuration <config_reloading_notify>` via `NOTIFY <https://www.postgresql.org/docs/current/sql-notify.html>`_.
This is useful in environments where you can't send SIGUSR1 or SIGUSR2 Unix Signals.
Like on cloud managed containers or on Windows systems.

.. code:: postgresql

  NOTIFY pgrst, 'reload schema'; -- reload schema cache
  NOTIFY pgrst, 'reload config'; -- reload config
  NOTIFY pgrst;                  -- reload both

By default, the LISTEN channel is enabled (:ref:`db-channel-enabled`) and named ``pgrst`` (:ref:`db-channel`).

Listener on Read Replicas
=========================


The ``LISTEN`` and ``NOTIFY`` commands do not work on PostgreSQL read replicas.
Thus, if you connect PostgREST to a read replica the Listener will fail to start.

.. code:: psql

  -- check if the instance is a replica
  postgres=# select pg_is_in_recovery();
   pg_is_in_recovery
  -------------------
   t
  (1 row)

  postgres=# LISTEN pgrst;
  ERROR:  cannot execute LISTEN during recovery

To work around this, you can connect the Listener to the primary while still using the :ref:`connection_pool` on the replica.

This can be done by using the standard `libpq multiple hosts <https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-MULTIPLE-HOSTS>`_ and `target_session_attrs <https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNECT-TARGET-SESSION-ATTRS>`_ in your :ref:`connection string <db-uri>`.

.. code:: bash

  db-uri = "postgres://read_replica.host,primary.host/mydb?target_session_attrs=read-only"

This will cause the :ref:`connection_pool` to connect to the read replica host and ``LISTEN`` on the fallback primary host.

.. note::

  - Under the hood, PostgREST forces `target_session_attrs=read-write <https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNECT-TARGET-SESSION-ATTRS>`_ for the ``LISTEN`` session.
    So if you specify ``target_session_attrs=read-only`` as mentioned above, PostgREST will override it for the ``LISTEN``.
  - ``read-only`` is only available on libpq >= 14, if you use a lower version you will get an error like ``invalid target_session_attrs value: \"read-only\"``.

.. _listener_automatic_recovery:

Automatic Recovery
==================

The listener will retry reconnecting to the database if connection loss happens.

- It will retry forever with exponential backoff, with a maximum backoff time of 32 seconds between retries. Each of these attempts are :ref:`logged <pgrst_logging>`.
- Automatic recovery can be disabled by setting :ref:`db-pool-automatic-recovery` to ``false``.
- To ensure a valid state, the listener reloads the :ref:`schema_cache` and :ref:`configuration` when recovering.
