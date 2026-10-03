.. _working_with_types:

Working with PostgreSQL data types
==================================

:author: `Laurence Isla <https://github.com/laurenceisla>`_

PostgREST makes use of PostgreSQL string representations to work with data types. Thanks to this, you can use special values, such as ``now`` for timestamps, ``yes`` for booleans or time values including the time zones. This page describes how you can take advantage of these string representations and some alternatives to perform operations on different PostgreSQL data types.

.. contents::
  :local:
  :depth: 1

.. NOTE: Titles are ordered alphabetically. New entries should respect this order.

Arrays
------

To handle `array types <https://www.postgresql.org/docs/current/arrays.html>`_ you can use string representation or JSON array format.

.. code-block:: postgres

  create table movies (
    id int primary key,
    title text not null,
    tags text[],
    performance_times time[]
  );

You can insert a new value using string representation.

.. code-block:: bash

  curl "http://localhost:3000/movies" \
    -X POST -H "Content-Type: application/json" \
    -d @- << EOF
    {
      "id": 1,
      "title": "Paddington",
      "tags": "{family,comedy,not streamable}",
      "performance_times": "{12:40,15:00,20:00}"
    }
  EOF

Or you could send the same data using JSON array format:

.. code-block:: bash

  curl "http://localhost:3000/movies" \
    -X POST -H "Content-Type: application/json" \
    -d @- << EOF
    {
      "id": 1,
      "title": "Paddington",
      "tags": ["family", "comedy", "not streamable"],
      "performance_times": ["12:40", "15:00", "20:00"]
    }
  EOF

To query the data you can use arrow operators. See :ref:`composite_array_columns`.

Multidimensional Arrays
~~~~~~~~~~~~~~~~~~~~~~~

Similarly to one-dimensional arrays, both the string representation and JSON array format are allowed.

.. code-block:: postgres

  -- This new column stores the cinema, floor and auditorium numbers in that order
  alter table movies
  add column cinema_floor_auditorium int[][][];

You can now update the item using JSON array format:

.. code-block:: bash

  curl "http://localhost:3000/movies?id=eq.1" \
    -X PATCH -H "Content-Type: application/json" \
    -d @- << EOF
    {
      "cinema_floor_auditorium": [ [ [1,2], [6,7] ], [ [3,5], [8,9] ] ]
    }
  EOF

Then, for example, to query the auditoriums that are located in the first cinema (position 0 in the array) and on the second floor (position 1 in the next inner array), we can use the arrow operators this way:

.. code-block:: bash

  curl "http://localhost:3000/movies?select=title,auditorium:cinema_floor_auditorium->0->1&id=eq.1"

.. code-block:: json

  [
    {
      "title": "Paddington",
      "auditorium": [6,7]
    }
  ]

Bytea
-----

To send raw binary to PostgREST you need a function with a single unnamed parameter of `bytea type <https://www.postgresql.org/docs/current/datatype-binary.html>`_.

.. code-block:: postgres

   create table files (
     id int primary key generated always as identity,
     file bytea
   );

   create function upload_binary(bytea) returns void as $$
     insert into files (file) values ($1);
   $$ language sql;

Let's download the PostgREST logo for our test.

.. code-block:: bash

   curl "https://postgrest.org/en/latest/_images/logo.png" -o postgrest-logo.png

Now, to send the file ``postgrest-logo.png`` we need to set the ``Content-Type: application/octet-stream`` header in the request:

.. code-block:: bash

  curl "http://localhost:3000/rpc/upload_binary" \
    -X POST -H "Content-Type: application/octet-stream" \
    --data-binary "@postgrest-logo.png"

To get the image from the database, use :ref:`custom_media` like so:

.. code-block:: postgres

  create domain "image/png" as bytea;

  create or replace get_image(id int) returns "image/png" as $$
    select file from files where id = $1;
  $$ language sql;

.. code-block:: bash

  curl "http://localhost:3000/get_image?id=1" \
    -H "Accept: image/png"

See :ref:`providing_img` for a step-by-step example on how to handle images in HTML.

.. warning::

   Be careful when saving binaries in the database, having a separate storage service for these is preferable in most cases. See `Storing Binary files in the Database <https://wiki.postgresql.org/wiki/BinaryFilesInDB>`_.

Composite Types
---------------

With PostgREST, you have two options to handle `composite type columns <https://www.postgresql.org/docs/current/rowtypes.html>`_.

.. code-block:: postgres

  create type dimension as (
    length decimal(6,2),
    width decimal (6,2),
    height decimal (6,2),
    unit text
  );

  create table products (
    id int primary key,
    size dimension
  );

  insert into products (id, size)
  values (1, '(5.0,5.0,10.0,"cm")');

On one hand you can insert values using string representation.

.. code-block:: bash

  curl "http://localhost:3000/products" \
    -X POST -H "Content-Type: application/json" \
    -d @- << EOF
    { "id": 2, "size": "(0.7,0.5,1.8,\"m\")" }
  EOF

Or you could insert the same data in JSON format.

.. code-block:: bash

  curl "http://localhost:3000/products" \
    -X POST -H "Content-Type: application/json" \
    -d @- << EOF
    {
      "id": 2,
      "size": {
        "length": 0.7,
        "width": 0.5,
        "height": 1.8,
        "unit": "m"
      }
    }
  EOF

You can also query the data using arrow operators. See :ref:`composite_array_columns`.

Enums
-----

You can handle `Enumerated Types <https://www.postgresql.org/docs/current/datatype-enum.html>`_ using string representations:

.. code-block:: postgres

  create type letter_size as enum ('s','m','l','xl');

  create table products (
    id int primary key generated always as identity,
    name text,
    size letter_size
  );

To insert or update the value use a string:

.. code-block:: bash

  curl -X POST "http://localhost:3000/products" \
    -H "Content-Type: application/json" \
    -d @- << EOF
    { "name": "t-shirt", "size": "l" }
  EOF

You can then query and filter the enum using the compatible :ref:`operators <operators>`.
For example, to get all the products larger than `m` and ordering them by their size:

.. code-block:: bash

  curl "http://localhost:3000/products?select=name,size&size=gt.m&order=size"

.. code-block:: json

  [
    {
      "name": "t-shirt",
      "size": "l"
    },
    {
      "name": "hoodie",
      "size": "xl"
    }
  ]


hstore
------

You can work with data types belonging to additional supplied modules such as `hstore <https://www.postgresql.org/docs/current/hstore.html>`_.

.. code-block:: postgres

  -- Activate the hstore module in the current database
  create extension if not exists hstore;

  create table countries (
    id int primary key,
    name hstore unique
  );

The ``name`` column will have the name of the country in different formats. You can insert values using the string representation for that data type:

.. code-block:: bash

  curl "http://localhost:3000/countries" \
    -X POST -H "Content-Type: application/json" \
    -d @- << EOF
    [
      { "id": 1, "name": "common => Egypt, official => \"Arab Republic of Egypt\", native => مصر" },
      { "id": 2, "name": "common => Germany, official => \"Federal Republic of Germany\", native => Deutschland" }
    ]
  EOF

Notice that the use of ``"`` in the value of the ``name`` column needs to be escaped using a backslash ``\``.

You can also query and filter the value of a ``hstore`` column using the arrow operators, as you would do for a :ref:`JSON column<json_columns>`. For example, if you want to get the native name of Egypt:

.. code-block:: bash

  curl "http://localhost:3000/countries?select=name->>native&name->>common=like.Egypt"

.. code-block:: json

  [{ "native": "مصر" }]

JSON
----

To work with a ``json`` type column, you can handle the value as a JSON object.

.. code-block:: postgres

  create table products (
    id int primary key,
    name text unique,
    extra_info json
  );

You can insert a new product using a JSON object for the ``extra_info`` column:

.. code-block:: bash

  curl "http://localhost:3000/products" \
    -X POST -H "Content-Type: application/json" \
    -d @- << EOF
    {
      "id": 1,
      "name": "Canned fish",
      "extra_info": {
        "expiry_date": "2025-12-31",
        "exportable": true
      }
    }
  EOF

To query and filter the data see :ref:`json_columns` for a complete reference.

Ranges
------

PostgREST allows you to handle `ranges <https://www.postgresql.org/docs/current/rangetypes.html>`_.

.. code-block:: postgres

   create table events (
     id int primary key,
     name text unique,
     duration tsrange
   );

To insert a new event, specify the ``duration`` value as a string representation of the ``tsrange`` type:

.. code-block:: bash

  curl "http://localhost:3000/events" \
    -X POST -H "Content-Type: application/json" \
    -d @- << EOF
    {
      "id": 1,
      "name": "New Year's Party",
      "duration": "['2022-12-31 11:00','2023-01-01 06:00']"
    }
  EOF

You can use range :ref:`operators <operators>` to filter the data. But, in this case, requesting a filter like ``events?duration=cs.2023-01-01`` will return an error, because PostgreSQL needs an explicit cast from string to timestamp. A workaround is to use a range starting and ending in the same date:

.. code-block:: bash

  curl "http://localhost:3000/events?duration=cs.\[2023-01-01,2023-01-01\]"

.. code-block:: json

  [
    {
      "id": 1,
      "name": "New Year's Party",
      "duration": "[\"2022-12-31 11:00:00\",\"2023-01-01 06:00:00\"]"
    }
  ]

.. _casting_range_to_json:

Casting a Range to a JSON Object
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

As you may have noticed, the ``tsrange`` value is returned as a string literal. To return it as a JSON value, first you need to create a function that will do the conversion from a ``tsrange`` type:

.. code-block:: postgres

   create or replace function tsrange_to_json(tsrange) returns json as $$
     select json_build_object(
       'lower', lower($1)
     , 'upper', upper($1)
     , 'lower_inc', lower_inc($1)
     , 'upper_inc', upper_inc($1)
     );
   $$ language sql;

Then, create the cast using this function:

.. code-block:: postgres

   create cast (tsrange as json) with function tsrange_to_json(tsrange) as assignment;

Finally, do the request :ref:`casting the range column <casting_columns>`:

.. code-block:: bash

  curl "http://localhost:3000/events?select=id,name,duration::json"

.. code-block:: json

  [
    {
      "id": 1,
      "name": "New Year's Party",
      "duration": {
        "lower": "2022-12-31T11:00:00",
        "upper": "2023-01-01T06:00:00",
        "lower_inc": true,
        "upper_inc": true
      }
    }
  ]

.. note::

   If you don't want to modify casts for built-in types, an option would be to `create a custom type <https://www.postgresql.org/docs/current/sql-createtype.html>`_
   for your own ``tsrange`` and add its own cast.

   .. code-block:: postgres

      create type mytsrange as range (subtype = timestamp, subtype_diff = tsrange_subdiff);

      -- define column types and casting function analogously to the above example
      -- ...

      create cast (mytsrange as json) with function mytsrange_to_json(mytsrange) as assignment;

Timestamps
----------

You can use the **time zone** to filter or send data if needed.

.. code-block:: postgres

  create table reports (
    id int primary key
    , due_date timestamptz
  );

Suppose you are located in Sydney and want create a report with the date in the local time zone. Your request should look like this:

.. code-block:: bash

  curl "http://localhost:3000/reports" \
    -X POST -H "Content-Type: application/json" \
    -d '[{ "id": 1, "due_date": "2022-02-24 11:10:15 Australia/Sydney" },{ "id": 2, "due_date": "2022-02-27 22:00:00 Australia/Sydney" }]'

Someone located in Cairo can retrieve the data using their local time, too:

.. code-block:: bash

  curl "http://localhost:3000/reports?due_date=eq.2022-02-24+02:10:15+Africa/Cairo"

.. code-block:: json

  [
    {
      "id": 1,
      "due_date": "2022-02-23T19:10:15-05:00"
    }
  ]

The response has the date in the time zone configured by the server: ``UTC -05:00`` (see :ref:`prefer_timezone`).

You can use other comparative filters and also all the `PostgreSQL special date/time input values <https://www.postgresql.org/docs/current/datatype-datetime.html#DATATYPE-DATETIME-SPECIAL-TABLE>`_ as illustrated in this example:

.. code-block:: bash

  curl "http://localhost:3000/reports?or=(and(due_date.gte.today,due_date.lte.tomorrow),and(due_date.gt.-infinity,due_date.lte.epoch))"

.. code-block:: json

  [
    {
      "id": 2,
      "due_date": "2022-02-27T06:00:00-05:00"
    }
  ]

.. raw:: html

  <script type="text/javascript">
    let hash = window.location.hash;

    const redirects = {
      // PostGIS
      '#postgis': '../integrations/postgis.html#postgis',
    };

    let willRedirectTo = redirects[hash];

    if (willRedirectTo) {
      window.location.href = willRedirectTo;
    }
  </script>
