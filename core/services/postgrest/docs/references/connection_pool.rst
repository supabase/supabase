.. _connection_pool:

Connection Pool
===============

A connection pool is a cache of reusable database connections. It allows serving many HTTP requests using few database connections. Every request to an :doc:`API resource <api>` borrows a connection from the pool to start a :doc:`transaction <transactions>`.

Minimizing connections is paramount to performance. Each PostgreSQL connection creates a process, having too many can exhaust available resources.

.. _pool_growth_limit:
.. _dyn_conn_pool:

Dynamic Connection Pool
-----------------------

To conserve system resources, PostgREST uses a dynamic connection pool. This enables the number of connections in the pool to increase and decrease depending on request traffic.

- If all the connections are being used, a new connection is added. The pool can grow until it reaches the :ref:`db-pool` size. Note that it's pointless to set this higher than the ``max_connections`` setting in your database.
- If a connection is unused for a period of time (:ref:`db-pool-max-idletime`), it will be released.
- For connecting to the database, the :ref:`authenticator <roles>` role is used. You can configure this using :ref:`db-uri`.

Connection Application Name
~~~~~~~~~~~~~~~~~~~~~~~~~~~

PostgREST sets the connection `application_name <https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNECT-FALLBACK-APPLICATION-NAME>`_ for all of its used connections.
This is useful for PostgreSQL statistics and logs.

For example, you can query `pg_stat_activity <https://www.postgresql.org/docs/current/monitoring-stats.html#MONITORING-PG-STAT-ACTIVITY-VIEW>`_ to get the PostgREST version:

.. code-block:: postgres

  select distinct usename, application_name
  from pg_stat_activity
  where usename = 'authenticator';

     usename     |     application_name
  ---------------+--------------------------
   authenticator | PostgREST 12.1


Connection lifetime
-------------------

Long-lived PostgreSQL connections can consume considerable memory (see `here <https://www.postgresql.org/message-id/CAFj8pRCQN2B2vrVMH1-bd-8xtzjytWR%2BAjZ%2BMCj9J2wPxKPa9Q%40mail.gmail.com>`_ for more details).
Under a busy system, the :ref:`db-pool-max-idletime` won't be reached and the connection pool can be full of long-lived connections.

To avoid this problem and save resources, a connection max lifetime (:ref:`db-pool-max-lifetime`) is enforced.
After the max lifetime is reached, connections from the pool will be released and new ones will be created. This doesn't affect running requests, only unused connections will be released.

.. _pool_timeout:

Acquisition Timeout
-------------------

If all the available connections in the pool are busy, an HTTP request will wait until reaching a timeout (:ref:`db-pool-acquisition-timeout`).

If the request reaches the timeout, it will be aborted with the following response:

.. code-block:: http

  HTTP/1.1 504 Gateway Timeout

  {"code":"PGRST003",
   "details":null,
   "hint":null,
   "message":"Timed out acquiring connection from connection pool."}

.. important::

  Getting this error message is an indicator of a performance issue. To solve it, you can:

  - Reduce your queries execution time.

    - Check the request :ref:`explain_plan` to tune your query, this usually means adding indexes.

  - Reduce the amount of requests.

    - Reduce write requests. Do :ref:`bulk_insert` (or :ref:`upsert`) instead of inserting rows one by one.
    - Reduce read requests. Use :ref:`resource_embedding`. Combine unrelated data into a single request using custom database views or functions.
    - Use :ref:`functions` for combining read and write logic into a single request.

  - Increase the :ref:`db-pool` size.

    - Not a panacea since connections can't grow infinitely. Try the previous recommendations before this.

.. _automatic_recovery:

Automatic Recovery
------------------

The server will retry reconnecting to the database if connection loss happens.

- It will retry forever with exponential backoff, with a maximum backoff time of 32 seconds between retries. Each of these attempts are :ref:`logged <pgrst_logging>`.
- It will only stop retrying if the server deems the error to be fatal. This can be a password authentication failure or an internal error.
- The retries happen immediately after a connection loss, if :ref:`db-channel-enabled` is set to true (the default). Otherwise they'll happen once a request arrives.
- To ensure a valid state, the server reloads the :ref:`schema_cache` and :ref:`configuration` when recovering.
- To notify the client of the next retry, the server sends a ``503 Service Unavailable`` status with the ``Retry-After: x`` header. Where ``x`` is the number of seconds programmed for the next retry.
- Automatic recovery can be disabled by setting :ref:`db-pool-automatic-recovery` to ``false``.

.. _external_connection_poolers:

Using External Connection Poolers
---------------------------------

It's possible to use external connection poolers, such as PgBouncer. Session pooling is compatible, while transaction pooling requires :ref:`db-prepared-statements` set to ``false``. Statement pooling is not compatible with PostgREST.

Also set :ref:`db-channel-enabled` to ``false`` since ``LISTEN`` is not compatible with transaction pooling. Although it should not give any errors if left enabled.

.. note::

  It's not recommended to use an external connection pooler. `Our benchmarks <https://github.com/PostgREST/postgrest/issues/2294#issuecomment-1139148672>`_ indicate it provides much lower performance than PostgREST built-in pool.
