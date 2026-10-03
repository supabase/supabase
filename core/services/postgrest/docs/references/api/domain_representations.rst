.. _domain_reps:

Domain Representations
######################

Domain Representations separates "how the data is presented" from "how the data is stored". It works by creating `domains <https://www.postgresql.org/docs/current/sql-createdomain.html>`_ and `casts <https://www.postgresql.org/docs/current/sql-createcast.html>`_, the latter act on the former to present and receive the data in different formats.

.. contents::
   :depth: 1
   :local:
   :backlinks: none

Custom Domain
=============

Suppose you want to use a ``uuid`` type for a primary key and want to present it shortened to web users.

For this, let's create a domain based on ``uuid``.

.. code-block:: postgres

  create domain app_uuid as uuid;

  -- and use it as our table PK.
  create table profiles(
    id   app_uuid
  , name text
  );

  -- some data for the example
  insert into profiles values ('846c4ffd-92ce-4de7-8d11-8e29929f4ec4', 'John Doe');

Domain Response Format
======================

We can shorten the ``uuid`` with ``base64`` encoding. Let's use JSON as our response format for this example.

To change the domain format for JSON, create a function that converts ``app_uuid`` to ``json``.

.. code-block:: postgres

  -- the name of the function is arbitrary
  CREATE OR REPLACE FUNCTION json(app_uuid) RETURNS json AS $$
    select to_json(encode(uuid_send($1),'base64'));
  $$ LANGUAGE SQL IMMUTABLE;

  -- check it works
  select json('846c4ffd-92ce-4de7-8d11-8e29929f4ec4'::app_uuid);
              json
  ----------------------------
   "hGxP/ZLOTeeNEY4pkp9OxA=="

Then create a CAST to tell PostgREST to convert it automatically whenever a JSON response is requested.

.. code-block:: postgres

  CREATE CAST (app_uuid AS json) WITH FUNCTION json(app_uuid) AS IMPLICIT;

With this you can obtain the data in the shortened format.

.. code-block:: bash

  curl "http://localhost:3000/profiles" \
    -H "Accept: application/json"

.. code-block:: json

  [{"id":"hGxP/ZLOTeeNEY4pkp9OxA==","name":"John Doe"}]

.. note::

  - Casts on domains are ignored by PostgreSQL, their interpretation is left to the application. We're discussing the possibility of including the Domain Representations behavior on `pgsql-hackers <https://www.postgresql.org/message-id/flat/CAGRrpzZKa%2BGu91j1SOvN3tM1f-7Gh_w441c5nAX1QqdH3Q31Lg%40mail.gmail.com>`_.
  - It would make more sense to use ``base58`` encoding as it's URL friendly but for simplicity we use ``base64`` (supported natively in PostgreSQL).

.. important::

  After creating a cast over a domain, you must refresh PostgREST schema cache. See :ref:`schema_reloading`.

Domain Filter Format
====================

For :ref:`h_filter` to work with the shortened format, you need a different conversion.

PostgREST considers the URL query string to be, in the most generic sense, ``text``. So let's create a function that converts ``text`` to ``app_uuid``.

.. code-block:: postgres

  -- the name of the function is arbitrary
  CREATE OR REPLACE FUNCTION app_uuid(text) RETURNS app_uuid AS $$
    select substring(decode($1,'base64')::text from 3)::uuid;
  $$ LANGUAGE SQL IMMUTABLE;

  -- plus a CAST to tell PostgREST to use this function
  CREATE CAST (text AS app_uuid) WITH FUNCTION app_uuid(text) AS IMPLICIT;

Now you can filter as usual.

.. code-block:: bash

  curl "http://localhost:3000/profiles?id=eq.ZLOTeeNEY4pkp9OxA==" \
    -H "Accept: application/json"

.. code-block:: json

  [{"id":"hGxP/ZLOTeeNEY4pkp9OxA==","name":"John Doe"}]

.. note::

  If there's no CAST from ``text`` to ``app_uuid`` defined, the filter will still work with the native uuid format (``846c4ffd-92ce-4de7-8d11-8e29929f4ec4``).

Domain Request Body Format
==========================

To accept the shortened format in a JSON request body, for example when creating a new record, define a ``json`` to ``app_uuid`` conversion.

.. code-block:: postgres

  -- the name of the function is arbitrary
  CREATE OR REPLACE FUNCTION app_uuid(json) RETURNS public.app_uuid AS $$
    -- here we reuse the previous app_uuid(text) function
    select app_uuid($1 #>> '{}');
  $$ LANGUAGE SQL IMMUTABLE;

  CREATE CAST (json AS public.app_uuid) WITH FUNCTION app_uuid(json) AS IMPLICIT;

Now we can :ref:`insert` (or :ref:`update`) as usual.

.. code-block:: bash

  curl "http://localhost:3000/profiles" \
    -H "Prefer: return=representation" \
    -H "Content-Type: application/json" \
    -d @- <<JSON

  {"id":"zH7HbFJUTfy/GZpwuirpuQ==","name":"Jane Doe"}

  JSON

The response:

.. code-block:: json

  [{"id":"zH7HbFJUTfy/GZpwuirpuQ==","name":"Jane Doe"}]

Note that on the database side we have our regular ``uuid`` format.

.. code-block:: postgres

  select * from profiles;

                    id                  |   name
  --------------------------------------+----------
   846c4ffd-92ce-4de7-8d11-8e29929f4ec4 | John Doe
   cc7ec76c-5254-4dfc-bf19-9a70ba2ae9b9 | Jane Doe
  (2 rows)

.. note::

  If there's no CAST from ``json`` to ``app_uuid`` defined, the request body will still work with the native uuid format (``cc7ec76c-5254-4dfc-bf19-9a70ba2ae9b9``).

Advantages over Views
=====================

`Views <https://www.postgresql.org/docs/current/sql-createview.html>`_ also allow us to change the format of the underlying type. However they come with drawbacks that increase complexity.

1) Formatting the column in the view makes it `non-updatable <https://www.postgresql.org/docs/current/sql-createview.html#SQL-CREATEVIEW-UPDATABLE-VIEWS>`_ since Postgres doesn't know how to reverse the transform. This can be worked around using INSTEAD OF triggers.
2) When filtering by this column, we get full table scans for the same reason (also applies to :ref:`computed_cols`) . The performance loss here can be avoided with a computed index, or using a materialized generated column.
3) If the formatted column is used as a foreign key, PostgREST can no longer detect that relationship and :ref:`resource_embedding` breaks. This can be worked around with :ref:`computed_relationships`.

Domain Representations avoid all the above drawbacks. Their only drawback is that for existing tables, you have to change the column types. But this should be a fast operation since domains are binary coercible with their underlying types. A table rewrite won't be required.

.. note::

  Why not create a `base type <https://www.postgresql.org/docs/current/sql-createtype.html#id-1.9.3.94.5.8>`_ instead? ``CREATE TYPE app_uuid (INTERNALLENGTH = 22, INPUT = app_uuid_parser, OUTPUT = app_uuid_formatter)``.

  Creating base types need superuser, which is restricted on cloud hosted databases. Additionally this way lets "how the data is presented" dictate "how the data is stored" which would be backwards.
