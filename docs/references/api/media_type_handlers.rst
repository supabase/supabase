.. _custom_media:

Media Type Handlers
###################

Media Type Handlers allow PostgREST to deliver custom media types. These handlers extend the :ref:`builtin ones <builtin_media>` and can also override them.

Media types are expressed as type aliases using `domains <https://www.postgresql.org/docs/current/sql-createdomain.html>`_ and their name must comply to `RFC 6838 requirements <https://datatracker.ietf.org/doc/html/rfc6838#section-4.2>`_.

.. code-block:: postgres

   CREATE DOMAIN "application/json" AS json;

Using these domains, :ref:`functions <functions>` can become handlers and `user-defined aggregates <https://www.postgresql.org/docs/current/xaggr.html>`_ can serve as handlers for :ref:`tables_views` and :ref:`table_functions`.

.. important::

  - PostgREST vendor media types (``application/vnd.pgrst.plan``, ``application/vnd.pgrst.object`` and ``application/vnd.pgrst.array``) cannot be overridden.
  - Long media types like ``application/vnd.openxmlformats-officedocument.wordprocessingml.document`` cannot be expressed as domains since they surpass `PostgreSQL identifier length <https://www.postgresql.org/docs/current/limits.html#LIMITS-TABLE>`_.
    For these you can use the :ref:`any_handler`.

Handler Function
================

As an example, let's obtain the `TWKB <https://postgis.net/docs/ST_AsTWKB.html>`_ compressed binary format for a PostGIS geometry.

.. code-block:: postgres

  create extension postgis;

  create table lines (
    id   int primary key
  , name text
  , geom geometry(LINESTRING, 4326)
  );

  insert into lines values (1, 'line-1', 'LINESTRING(1 1,5 5)'::geometry), (2, 'line-2', 'LINESTRING(2 2,6 6)'::geometry);

For this you can create a vendor media type.

.. code-block:: postgres

  create domain "application/vnd.twkb" as bytea;

And use it as a return type on a function, to make it a handler.

.. code-block:: postgres

  create or replace function get_line (id int)
  returns "application/vnd.twkb" as $$
    select st_astwkb(geom) from lines where id = get_line.id;
  $$ language sql;

.. note::

   For PostgreSQL <= 12, you'll need a cast on the function body :code:`st_astwkb(geom)::"application/vnd.twkb"`.

Now you can request the ``TWKB`` output like so:

.. code-block:: bash

  curl 'localhost:3000/rpc/get_line?id=1' -i \
    -H "Accept: application/vnd.twkb"

  HTTP/1.1 200 OK
  Content-Type: application/vnd.twkb

  # binary output

Note that PostgREST will automatically set the  ``Content-Type`` to ``application/vnd.twkb``.

Handlers for Tables/Views
=========================

To benefit from a compressed format like ``TWKB``, it makes more sense to obtain many rows instead of one. Let's allow that by adding a handler for the table.

User-defined aggregates can be turned into handlers by using domain media types as the return type of their transition or final functions.

Let's create a transition function for this example.

.. code-block:: postgres

  create or replace function twkb_handler_transition (state bytea, next lines)
  returns "application/vnd.twkb" as $$
    select state || st_astwkb(next.geom);
  $$ language sql;

Now we'll use it on a new aggregate defined for the ``lines`` table.

.. code-block:: postgres

  create or replace aggregate twkb_agg (lines) (
    initcond = ''
  , stype = "application/vnd.twkb"
  , sfunc = twkb_handler_transition
  );

.. note::

  You can test see this aggregate working with:

  .. code-block:: psql

    SELECT twkb_agg(l) from lines l;

                               twkb_agg
    ---------------------------------------------------------------
    \xa20002c09a0cc09a0c80ea3080ea30a2000280b51880b51880ea3080ea30
    (1 row)

Now you can request the table endpoint with the ``twkb`` media type:

.. code-block:: bash

  curl 'localhost:3000/lines' -i \
    -H "Accept: application/vnd.twkb"

  HTTP/1.1 200 OK
  Content-Type: application/vnd.twkb

  # binary output

If you have a table-valued function returning the same table type, the handler can also act upon on it.

.. code-block:: postgres

  create or replace function get_lines ()
  returns setof lines as $$
    select * from lines;
  $$ language sql;

.. code-block:: bash

  curl 'localhost:3000/get_lines' -i \
    -H "Accept: application/vnd.twkb"

  HTTP/1.1 200 OK
  Content-Type: application/vnd.twkb

  # binary output

Overriding a Builtin Handler
============================

Let's override the existing ``text/csv`` handler for the table to provide a more complex CSV output.
It'll include a `Byte order mark (BOM) <https://en.wikipedia.org/wiki/Byte_order_mark>`_ plus a ``Content-Disposition`` header to set a name for the downloaded file.

Create a domain for the standard ``text/csv`` media type.

.. code-block:: postgres

  create domain "text/csv" as text;

And a transition function that returns the domain.

.. code-block:: postgres

  create or replace function bom_csv_trans (state text, next lines)
  returns "text/csv" as $$
    select state || next.id::text || ',' || next.name || ',' || next.geom::text || E'\n';
  $$ language sql;

This time we'll add a final function. This will add the CSV header, the BOM and the ``Content-Disposition`` header.

.. code-block:: postgres

  create or replace function bom_csv_final (data "text/csv")
  returns "text/csv" as $$
    -- set the Content-Disposition header
    select set_config('response.headers', '[{"Content-Disposition": "attachment; filename=\"lines.csv\""}]', true);
    select
      -- EFBBBF is the BOM in UTF8 https://en.wikipedia.org/wiki/Byte_order_mark#UTF-8
      convert_from (decode (E'EFBBBF', 'hex'),'UTF8') ||
      -- the header for the CSV
      (E'id,name,geom\n' || data);
  $$ language sql;

Now use the transition and final function as part of the new aggregate.

.. code-block:: postgres

  create or replace aggregate bom_csv_agg (lines) (
    initcond = ''
  , stype = "text/csv"
  , sfunc = bom_csv_trans
  , finalfunc = bom_csv_final
  );

.. note::

  You can test this with:

  .. code-block:: psql

    select bom_csv_agg(l) from lines l;
                                                 bom_csv_agg
    -----------------------------------------------------------------------------------------------------
     ﻿id,name,geom                                                                                      +
     1,line-1,0102000020E610000002000000000000000000F03F000000000000F03F00000000000014400000000000001440+
     2,line-2,0102000020E6100000020000000000000000000040000000000000004000000000000018400000000000001840+

    (1 row)

And request it like:

.. code-block:: bash

  curl 'localhost:3000/lines' -i \
    -H "Accept: text/csv"

  HTTP/1.1 200 OK
  Content-Type: text/csv
  Content-Disposition: attachment; filename="lines.csv"

  id,name,geom
  1,line-1,0102000020E610000002000000000000000000F03F000000000000F03F00000000000014400000000000001440
  2,line-2,0102000020E6100000020000000000000000000040000000000000004000000000000018400000000000001840

.. _any_handler:

The "Any" Handler
=================

For more flexibility, you can also define a catch-all handler by using a domain named ``*/*`` (any media type). This handler obeys the following rules:

- It responds to all media types and even to requests that don't include an ``Accept`` header.
- It sets the ``Content-Type`` header to ``application/octet-stream`` by default, but this can be overridden inside the function with :ref:`guc_resp_hdrs`.
- It overrides all other handlers (:ref:`builtin <builtin_media>` or custom), so it's better to do it for an isolated function or view.

Let's define an any handler for a view that will always respond with ``XML`` output. It will accept ``text/xml``, ``application/xml``, ``*/*`` and reject other media types.

.. code-block:: postgres

  create domain "*/*" as bytea;

  -- we'll use an .xml suffix for the view to be clear its output is always XML
  create view "lines.xml" as
  select * from lines;

  -- transition function
  create or replace function lines_xml_trans (state "*/*", next "lines.xml")
  returns "*/*" as $$
    select state || xmlelement(name line, xmlattributes(next.id as id, next.name as name), next.geom)::text::bytea || E'\n' ;
  $$ language sql;

  -- final function
  create or replace function lines_xml_final (data "*/*")
  returns "*/*" as $$
  declare
    -- get the Accept header
    req_accept text := current_setting('request.headers', true)::json->>'accept';
  begin
    -- when we need to override the default Content-Type (application/octet-stream) set by PostgREST
    if req_accept = '*/*' then
      perform set_config('response.headers', json_build_array(json_build_object('Content-Type', 'text/xml'))::text, true);
    elsif req_accept IN ('application/xml', 'text/xml') then
      perform set_config('response.headers', json_build_array(json_build_object('Content-Type', req_accept))::text, true);
    else
      -- we'll reject other non XML media types, we need to reject manually since */* will command PostgREST to accept all media types
      raise sqlstate 'PT415' using message = 'Unsupported Media Type';
    end if;

    return data;
  end; $$ language plpgsql;

  -- new aggregate
  create or replace aggregate lines_xml_agg ("lines.xml") (
    stype = "*/*"
  , sfunc = lines_xml_trans
  , finalfunc = lines_xml_final
  );

Test it on SQL:

.. code-block:: psql

  select (encode(lines_xml_agg(x), 'escape'))::xml from "lines.xml" x;
                                                              encode
  ------------------------------------------------------------------------------------------------------------------------------
   <line id="1" name="line-1">0102000020E610000002000000000000000000F03F000000000000F03F00000000000014400000000000001440</line>+
   <line id="2" name="line-2">0102000020E6100000020000000000000000000040000000000000004000000000000018400000000000001840</line>+

Now we can omit the ``Accept`` header and it will respond with XML.

.. code-block:: bash

  curl 'localhost:3000/lines.xml' -i

  HTTP/1.1 200 OK
  Content-Type: text/xml

  <line id="1" name="line-1">0102000020E610000002000000000000000000F03F000000000000F03F00000000000014400000000000001440</line>
  <line id="2" name="line-2">0102000020E6100000020000000000000000000040000000000000004000000000000018400000000000001840</line>

And it will accept only XML media types.

.. code-block:: bash

  curl 'localhost:3000/lines.xml' -i \
    -H "Accept: text/xml"

  HTTP/1.1 200 OK
  Content-Type: text/xml

.. code-block:: bash

  curl 'localhost:3000/lines.xml' -i  \
    -H "Accept: application/xml"

  HTTP/1.1 200 OK
  Content-Type: text/xml

.. code-block:: bash

  curl 'localhost:3000/lines.xml' -i \
    -H "Accept: unknown/media"

  HTTP/1.1 415 Unsupported Media Type
