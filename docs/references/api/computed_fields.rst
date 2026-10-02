.. _computed_cols:

Computed Fields
###############

Computed fields are virtual columns that are not stored in a table. PostgreSQL makes it possible to implement them using functions on table types.

.. code-block:: postgres

  CREATE TABLE people (
    first_name text
  , last_name  text
  , job        text
  );

  -- a computed field that combines data from two columns
  CREATE FUNCTION full_name(people)
  RETURNS text AS $$
    SELECT $1.first_name || ' ' || $1.last_name;
  $$ LANGUAGE SQL;

Horizontal Filtering on Computed Fields
=======================================

:ref:`h_filter` can be applied to computed fields. For example, we can do a :ref:`fts` on :code:`full_name`:

.. code-block:: postgres

  -- (optional) you can add an index on the computed field to speed up the query
  CREATE INDEX people_full_name_idx ON people
    USING GIN (to_tsvector('english', full_name(people)));

.. code-block:: bash

  curl "http://localhost:3000/people?full_name=fts.Beckett"

.. code-block:: json

  [
    {"first_name": "Samuel", "last_name": "Beckett", "job": "novelist"}
  ]

Vertical Filtering on Computed Fields
=====================================

Computed fields won't appear on the response by default but you can use :ref:`v_filter` to include them:

.. code-block:: bash

  curl "http://localhost:3000/people?select=full_name,job"

.. code-block:: json

  [
    {"full_name": "Samuel Beckett", "job": "novelist"}
  ]

Ordering on Computed Fields
===========================

:ref:`ordering` on computed fields is also possible:

.. code-block:: bash

  curl "http://localhost:3000/people?order=full_name.desc"

.. important::

  Computed fields must be created in the :ref:`exposed schema <db-schemas>` or in a schema in the :ref:`extra search path <db-extra-search-path>` to be used in this way. When placing the computed field in the :ref:`exposed schema <db-schemas>` you can use an **unnamed** parameter, as in the example above, to prevent it from being exposed as an :ref:`RPC <functions>` under ``/rpc``.

.. note::

   - PostgreSQL 12 introduced `generated columns <https://www.postgresql.org/docs/12/ddl-generated-columns.html>`_, which can also compute a value based on other columns. However they're stored, not virtual.
   - "computed fields" are documented on https://www.postgresql.org/docs/current/rowtypes.html#ROWTYPES-USAGE (search for "computed fields")
   - On previous PostgREST versions this feature was documented with the name of "computed columns".
