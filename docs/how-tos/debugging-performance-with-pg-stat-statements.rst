.. _debugging_performance_pg_stat_statements:

Debugging Performance with pg_stat_statements
=============================================

This how-to shows how to get a query identifier through PostgREST and then use it to inspect the same query in ``pg_stat_statements``.

.. important::

  - :ref:`db-plan-enabled` must be enabled in PostgREST.
  - PostgreSQL 14 or newer with ``pg_stat_statements`` available.

Get the Query Identifier from PostgREST
---------------------------------------

Request the plan in JSON format with the ``verbose`` option:

.. code-block:: bash

   curl "http://localhost:3000/projects?select=id,name&order=id" \
     -H "Accept: application/vnd.pgrst.plan+json; options=verbose"

The response will contain a top-level ``Query Identifier`` field:

.. code-block:: json

   [
     {
       "Plan": {
         "Node Type": "Aggregate"
       },
       "Query Identifier": -432192689578025496
     }
   ]

Look up the query in pg_stat_statements
---------------------------------------

Use that identifier against ``pg_stat_statements``:

.. code-block:: postgres

   select
     calls,
     total_exec_time,
     mean_exec_time,
     rows,
     query
   from pg_stat_statements
   where queryid = -432192689578025496;

.. csv-table::
   :header: "calls", "total_exec_time", "mean_exec_time", "rows", "query"

   "13", "0.6355850000000001", "0.04889115384615385", "13", "WITH pgrst_source AS (...)"

This lets you correlate a PostgREST request with PostgreSQL runtime statistics such as:

- how often the query ran
- total and average execution time
- how many rows it produced
- the normalized SQL text recorded by PostgreSQL
