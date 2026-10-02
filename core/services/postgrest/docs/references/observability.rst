.. _observability:

Observability
#############

Observability allows measuring a system's current state based on the data it generates, such as logs, metrics, and traces.

.. contents::
   :depth: 1
   :local:
   :backlinks: none

.. _pgrst_logging:

Logs
====

PostgREST logs basic request information to ``stdout``, including the authenticated user if available, the requesting IP address and user agent, the URL requested, the HTTP response status and the response body size in bytes if available.

With :ref:`log-level` set to ``info``, we get:

.. code::

   127.0.0.1 - user [26/Jul/2021:01:56:38 -0500] "GET /clients HTTP/1.1" 200 56 "" "curl/7.64.0"
   127.0.0.1 - anonymous [26/Jul/2021:01:56:48 -0500] "GET /unexistent HTTP/1.1" 404 162 "" "curl/7.64.0"

For diagnostic information about the server itself, PostgREST logs to ``stderr``:

  - The full version of the connected PostgreSQL database.
  - :ref:`schema_cache` statistics.
  - The messages received by the :ref:`listener`.

.. code::

   06/May/2024:08:16:11 -0500: Starting PostgREST 12.1...
   06/May/2024:08:16:11 -0500: Successfully connected to PostgreSQL 14.10 (Ubuntu 14.10-0ubuntu0.22.04.1) on x86_64-pc-linux-gnu, compiled by gcc (Ubuntu 11.4.0-1ubuntu1~22.04) 11.4.0, 64-bit
   06/May/2024:08:16:11 -0500: Connection Pool initialized with a maximum size of 10 connections
   06/May/2024:08:16:11 -0500: API server listening on port 3000
   06/May/2024:08:16:11 -0500: Listening for database notifications on the "pgrst" channel
   06/May/2024:08:16:11 -0500: Config reloaded
   06/May/2024:08:16:11 -0500: Schema cache queried in 3.8 milliseconds
   06/May/2024:08:16:11 -0500: Schema cache loaded 15 Relations, 8 Relationships, 8 RPCs, 0 Domain Representations, 4 Media Type Handlers
   06/May/2024:14:11:27 -0500: Received a config reload message on the "pgrst" channel
   06/May/2024:14:11:27 -0500: Config reloaded

.. note::

  Logs are based on the ``log-level`` setting. See :ref:`log-level`.

.. _sql_query_logs:

SQL Query Logs
--------------

To log the SQL queries executed for a request, set the :ref:`log-query` to ``true``. It will be logged based on the current :ref:`log-level` setting.

.. code-block:: bash

  log-level = "warn"
  log-query = "true"

The SQL queries will only be logged on ``400`` HTTP errors and up.
So, if the user requests a resource without sufficient privileges:

.. code-block:: bash

  curl "localhost:3000/protected_table"

This will be logged by PostgREST:

.. code::

  17/Feb/2025:17:28:15 -0500: WITH pgrst_source AS ( SELECT "public"."protected_table".* FROM "public"."protected_table"  )  SELECT null::bigint AS total_result_set, pg_catalog.count(_postgrest_t) AS page_total, coalesce(json_agg(_postgrest_t), '[]') AS body, nullif(current_setting('response.headers', true), '') AS response_headers, nullif(current_setting('response.status', true), '') AS response_status, '' AS response_inserted FROM ( SELECT * FROM pgrst_source ) _postgrest_t
  127.0.0.1 - web_anon [17/Feb/2025:17:28:15 -0500] "GET /protected_table HTTP/1.1" 401 99 "" "curl/8.7.1"

Schema cache queries are logged only at the ``info`` and ``debug`` levels.

Database Logs
-------------

Additionally, to find all the SQL operations, you can watch the database logs. By default PostgreSQL does not keep these logs, so you'll need to make the configuration changes below.

Find :code:`postgresql.conf` inside your PostgreSQL data directory (to find that, issue the command :code:`show data_directory;`). Either find the settings scattered throughout the file and change them to the following values, or append this block of code to the end of the configuration file.

.. code:: sql

  # send logs where the collector can access them
  log_destination = "stderr"

  # collect stderr output to log files
  logging_collector = on

  # save logs in pg_log/ under the pg data directory
  log_directory = "pg_log"

  # (optional) new log file per day
  log_filename = "postgresql-%Y-%m-%d.log"

  # log every kind of SQL statement
  log_statement = "all"

Restart the database and watch the log file in real-time to understand how HTTP requests are being translated into SQL commands.

.. note::

  On Docker you can enable the logs by using a custom ``init.sh``:

  .. code:: bash

    #!/bin/sh
    echo "log_statement = 'all'" >> /var/lib/postgresql/data/postgresql.conf

  After that you can start the container and check the logs with ``docker logs``.

  .. code:: bash

    docker run -v "$(pwd)/init.sh":"/docker-entrypoint-initdb.d/init.sh" -d postgres
    docker logs -f <container-id>

.. _metrics:

Metrics
=======

The ``metrics`` endpoint on the :ref:`admin_server` endpoint provides metrics in `Prometheus text format <https://prometheus.io/docs/instrumenting/exposition_formats/#prometheus-text-format>`_.

.. code-block:: bash

  curl "http://localhost:3001/metrics"

.. code-block:: http

  HTTP/1.1 200 OK
  Content-Type: text/plain; charset=utf-8

  # HELP pgrst_schema_cache_query_time_seconds The query time in seconds of the last schema cache load
  # TYPE pgrst_schema_cache_query_time_seconds gauge
  pgrst_schema_cache_query_time_seconds 1.5937927e-2
  # HELP pgrst_schema_cache_loads_total The total number of times the schema cache was loaded
  # TYPE pgrst_schema_cache_loads_total counter
  pgrst_schema_cache_loads_total 1.0
  ...

Schema Cache Metrics
--------------------

Metrics related to the :ref:`schema_cache`.

pgrst_schema_cache_query_time_seconds
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

======== =======
**Type** Gauge
======== =======

The query time in seconds of the last schema cache load.

pgrst_schema_cache_loads_total
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

========== ==========================
**Type**   Counter
**Labels** ``status``: SUCCESS | FAIL
========== ==========================

The total number of times the schema cache was loaded.

Connection Pool Metrics
-----------------------

Metrics related to the :ref:`connection_pool`.

pgrst_db_pool_timeouts_total
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

======== =======
**Type** Counter
======== =======

The total number of pool connection timeouts.

pgrst_db_pool_available
~~~~~~~~~~~~~~~~~~~~~~~

======== =======
**Type** Gauge
======== =======

Available connections in the pool.

pgrst_db_pool_waiting
~~~~~~~~~~~~~~~~~~~~~

======== =======
**Type** Gauge
======== =======

Requests waiting to acquire a pool connection

pgrst_db_pool_max
~~~~~~~~~~~~~~~~~

======== =======
**Type** Gauge
======== =======

Max pool connections.

.. _jwt_cache_metrics:

JWT Cache Metrics
-----------------

Metrics related to the :ref:`jwt_caching`.

pgrst_jwt_cache_requests_total
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

======== =======
**Type** Counter
======== =======

The total number of JWT cache lookups.

pgrst_jwt_cache_hits_total
~~~~~~~~~~~~~~~~~~~~~~~~~~

======== =======
**Type** Counter
======== =======

The total number of JWT cache hits.

pgrst_jwt_cache_evictions_total
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

======== =======
**Type** Counter
======== =======

The total number of JWT cache evictions.

GHC Runtime Metrics
-------------------

PostgREST can also expose GHC runtime system metrics. These use the ``ghc_*``
prefix and include
`GHC RTS statistics <https://ghc.gitlab.haskell.org/ghc/doc/libraries/base-4.22.0.0-inplace/GHC-Stats.html#g:1>`_
for runtime allocation, garbage collection, memory, and CPU/elapsed time.

These are useful for monitoring PostgREST process health and diagnosing memory
pressure or GC behavior.

To expose these metrics, enable GHC RTS statistics when starting PostgREST:

.. code-block:: bash

  postgrest +RTS -T -RTS

When enabled, the admin ``/metrics`` endpoint includes samples such as:

.. code-block:: text

  # HELP ghc_gcs_total Total number of GCs
  # TYPE ghc_gcs_total counter
  ghc_gcs_total 1
  # HELP ghc_allocated_bytes_total Total bytes allocated
  # TYPE ghc_allocated_bytes_total counter
  ghc_allocated_bytes_total 12345678

Other available GHC runtime metrics include:

- ``ghc_gcs_total``
- ``ghc_major_gcs_total``
- ``ghc_allocated_bytes_total``
- ``ghc_max_live_bytes``
- ``ghc_max_mem_in_use_bytes``
- ``ghc_mutator_cpu_seconds_total``
- ``ghc_gc_cpu_seconds_total``
- ``ghc_elapsed_seconds_total``

Traces
======

Server Version Header
---------------------

When debugging a problem it's important to verify the running PostgREST version. For this you can look at the :code:`Server` HTTP response header that is returned on every request.

.. code::

  HEAD /users HTTP/1.1

  Server: postgrest/11.0.1

.. _trace_header:

Trace Header
------------

You can enable tracing HTTP requests by setting :ref:`server-trace-header`. Specify the set header in the request, and the server will include it in the response.

.. code:: bash

  server-trace-header = "X-Request-Id"

.. code-block:: bash

  curl "http://localhost:3000/users" \
    -H "X-Request-Id: 123"

.. code::

  HTTP/1.1 200 OK
  X-Request-Id: 123

Proxy-Status Header
-------------------

See :ref:`proxy-status_header`.

.. _server-timing_header:

Server-Timing Header
--------------------

You can enable the `Server-Timing <https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Server-Timing>`_ header by setting :ref:`server-timing-enabled` on.
This header communicates metrics of the different phases in the request-response cycle.

.. code-block:: bash

  curl "http://localhost:3000/users" -i

.. code::

  HTTP/1.1 200 OK

  Server-Timing: jwt;dur=14.9, parse;dur=71.1, plan;dur=109.0, transaction;dur=353.2, response;dur=4.4

- All the durations (``dur``) are in milliseconds.
- The ``jwt`` stage is when :ref:`jwt_auth` is done. This duration can be lowered with :ref:`jwt_caching`.
- On the ``parse`` stage, the :ref:`url_grammar` is parsed.
- On the ``plan`` stage, the :ref:`schema_cache` is used to generate the :ref:`main_query` of the transaction.
- The ``transaction`` stage corresponds to the database transaction. See :ref:`transactions`.
- The ``response`` stage is where the response status and headers are computed.

.. note::

  We're working on lowering the duration of the ``parse`` and ``plan`` stages on https://github.com/PostgREST/postgrest/issues/2816.

.. _content-length_header:

Content-Length Header
---------------------

You can verify the response body size in bytes in the `Content-Length header <https://httpwg.org/specs/rfc9110.html#field.content-length>`_.

.. code-block:: bash

  curl -i 'localhost:3000/users'

.. code-block:: http

  HTTP/1.1 200 OK
  Content-Length: 104

Note that this header won't be returned on ``HEAD`` requests for optimization purposes (see :ref:`head_req`).
This is in line with `RFC 9110 <https://httpwg.org/specs/rfc9110.html#field.content-length>`_.

The body size is also present in the :ref:`PostgREST logs <pgrst_logging>`.

.. _explain_plan:

Execution plan
--------------

You can get the `EXPLAIN execution plan <https://www.postgresql.org/docs/current/sql-explain.html>`_ of a request by adding the ``Accept: application/vnd.pgrst.plan`` header.
This is enabled by :ref:`db-plan-enabled` (false by default).

.. code-block:: bash

  curl "http://localhost:3000/users?select=name&order=id" \
    -H "Accept: application/vnd.pgrst.plan"

.. code-block:: postgres

  Aggregate  (cost=73.65..73.68 rows=1 width=112)
    ->  Index Scan using users_pkey on users  (cost=0.15..60.90 rows=850 width=36)

The output of the plan is generated in ``text`` format by default but you can change it to JSON by using the ``+json`` suffix.

.. code-block:: bash

  curl "http://localhost:3000/users?select=name&order=id" \
    -H "Accept: application/vnd.pgrst.plan+json"

.. code-block:: json

  [
    {
      "Plan": {
        "Node Type": "Aggregate",
        "Strategy": "Plain",
        "Partial Mode": "Simple",
        "Parallel Aware": false,
        "Async Capable": false,
        "Startup Cost": 73.65,
        "Total Cost": 73.68,
        "Plan Rows": 1,
        "Plan Width": 112,
        "Plans": [
          {
            "Node Type": "Index Scan",
            "Parent Relationship": "Outer",
            "Parallel Aware": false,
            "Async Capable": false,
            "Scan Direction": "Forward",
            "Index Name": "users_pkey",
            "Relation Name": "users",
            "Alias": "users",
            "Startup Cost": 0.15,
            "Total Cost": 60.90,
            "Plan Rows": 850,
            "Plan Width": 36
          }
        ]
      }
    }
  ]

By default the plan is assumed to generate the JSON representation of a resource(``application/json``), but you can obtain the plan for the :ref:`different representations that PostgREST supports <res_format>` by adding them to the ``for`` parameter. For instance, to obtain the plan for a ``text/xml``, you would use ``Accept: application/vnd.pgrst.plan; for="text/xml``.

The other available parameters are ``analyze``, ``verbose``, ``settings``, ``buffers`` and ``wal``, which correspond to the `EXPLAIN command options <https://www.postgresql.org/docs/current/sql-explain.html>`_. To use the ``analyze`` and ``wal`` parameters for example, you would add them like ``Accept: application/vnd.pgrst.plan; options=analyze|wal``.

For a workflow that takes the ``Query Identifier`` from a verbose PostgREST plan and uses it to inspect the same query in ``pg_stat_statements``, see :ref:`debugging_performance_pg_stat_statements`.

Note that akin to the EXPLAIN command, the changes will be committed when using the ``analyze`` option. To avoid this, you can use the :ref:`db-tx-end` and the ``Prefer: tx=rollback`` header.

Securing the Execution Plan
~~~~~~~~~~~~~~~~~~~~~~~~~~~

It's recommended to only activate :ref:`db-plan-enabled` on testing environments since it reveals internal database details.
However, if you choose to use it in production you can add a :ref:`db-pre-request` to filter the requests that can use this feature.

For example, to only allow requests from an IP address to get the execution plans:

.. code-block:: postgres

 -- Assuming a proxy(Nginx, Cloudflare, etc) passes an "X-Forwarded-For" header(https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-For)
 create or replace function filter_plan_requests()
 returns void as $$
 declare
   headers   json := current_setting('request.headers', true)::json;
   client_ip text := coalesce(headers->>'x-forwarded-for', '');
   accept    text := coalesce(headers->>'accept', '');
 begin
   if accept like 'application/vnd.pgrst.plan%' and client_ip != '144.96.121.73' then
     raise insufficient_privilege using
       message = 'Not allowed to use application/vnd.pgrst.plan';
   end if;
 end; $$ language plpgsql;

 -- set this function on your postgrest.conf
 -- db-pre-request = filter_plan_requests

.. raw:: html

  <script type="text/javascript">
    let hash = window.location.hash;

    const redirects = {
      '#health_check': 'health_check.html',
      '#server-version': '#server-version-header',
    };

    let willRedirectTo = redirects[hash];

    if (willRedirectTo) {
      window.location.href = willRedirectTo;
    }
  </script>
