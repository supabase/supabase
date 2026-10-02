.. _preferences:

Prefer Header
#############

PostgREST honors the Prefer HTTP header specified on `RFC 7240 <https://www.rfc-editor.org/rfc/rfc7240.html>`_. It allows clients to specify required and optional behaviors for their requests.

The following preferences are supported.

- ``Prefer: handling``. See :ref:`prefer_handling`.
- ``Prefer: timezone``. See :ref:`prefer_timezone`.
- ``Prefer: return``. See :ref:`prefer_return`.
- ``Prefer: count``. See :ref:`prefer_count`.
- ``Prefer: resolution``. See :ref:`prefer_resolution`.
- ``Prefer: missing``. See :ref:`prefer_missing`.
- ``Prefer: max-affected``, See :ref:`prefer_max_affected`.
- ``Prefer: tx``. See :ref:`prefer_tx`.

.. _prefer_handling:

Strict or Lenient Handling
==========================

The server ignores unrecognized or unfulfillable preferences by default. You can control this behavior with the ``handling`` preference. It can take two values: ``lenient`` (the default) or ``strict``.

``handling=strict`` will throw an error if you specify invalid preferences. For instance:

.. code-block:: bash

  curl -i "http://localhost:3000/projects" \
    -H "Prefer: handling=strict, foo, bar"

.. code-block:: http

  HTTP/1.1 400 Bad Request
  Content-Type: application/json; charset=utf-8

.. code-block:: json

  {
      "code": "PGRST122",
      "message": "Invalid preferences given with handling=strict",
      "details": "Invalid preferences: foo, bar",
      "hint": null
  }


``handling=lenient`` ignores invalid preferences.

.. code-block:: bash

  curl -i "http://localhost:3000/projects" \
    -H "Prefer: handling=lenient, foo, bar"

.. code-block:: http

  HTTP/1.1 200 OK
  Content-Type: application/json; charset=utf-8

.. _prefer_timezone:

Timezone
========

.. important::

  ``handling=lenient`` is ignored for ``timezone``. Invalid time zones always return an error.

The ``timezone`` preference allows you to change the `PostgreSQL timezone <https://www.postgresql.org/docs/current/runtime-config-client.html#GUC-TIMEZONE>`_.
It accepts all time zones in `pg_timezone_names <https://www.postgresql.org/docs/current/view-pg-timezone-names.html>`_ and numeric offsets.

.. code-block:: bash

  curl -i "http://localhost:3000/timestamps" \
    -H "Prefer: timezone=America/Los_Angeles"

.. code-block:: http

  HTTP/1.1 200 OK
  Content-Type: application/json; charset=utf-8
  Preference-Applied: timezone=America/Los_Angeles

.. code-block:: json

  [
    {"t":"2023-10-18T05:37:59.611-07:00"},
    {"t":"2023-10-18T07:37:59.611-07:00"},
    {"t":"2023-10-18T09:37:59.611-07:00"}
  ]

Offsets are also accepted:

.. code-block:: bash

  curl -i "http://localhost:3000/timestamps" \
    -H "Prefer: timezone=05:30"

.. code-block:: http

  HTTP/1.1 200 OK
  Content-Type: application/json; charset=utf-8
  Preference-Applied: timezone=05:30

.. code-block:: json

  [
    {"t":"2023-10-18T17:07:59.611+05:30"},
    {"t":"2023-10-18T19:07:59.611+05:30"},
    {"t":"2023-10-18T21:07:59.611+05:30"}
  ]

You can also use negative offsets like ``-03:00``.

For an invalid time zone, PostgREST returns a database error.

.. code-block:: bash

  curl -i "http://localhost:3000/timestamps" \
    -H "Prefer: timezone=Jupiter/Red_Spot"

.. code-block:: http

  HTTP/1.1 400 Bad Request

.. _prefer_return:

Return Representation
=====================

The ``return`` preference can be used to obtain information about affected resource when it's :ref:`inserted <insert>`, :ref:`updated <update>` or :ref:`deleted <delete>`.
This helps avoid a subsequent GET request.

Minimal
-------

With ``Prefer: return=minimal``, no response body will be returned. This is the default mode for all write requests.

Headers Only
------------

If the table has a primary key, the response can contain a :code:`Location` header describing where to find the new object by including the header :code:`Prefer: return=headers-only` in the request. Make sure that the table is not write-only, otherwise constructing the :code:`Location` header will cause a permissions error.

.. code-block:: bash

  curl -i "http://localhost:3000/projects" -X POST \
    -H "Content-Type: application/json" \
    -H "Prefer: return=headers-only" \
    -d '{"id":33, "name": "x"}'

.. code-block:: http

  HTTP/1.1 201 Created
  Location: /projects?id=eq.34
  Preference-Applied: return=headers-only

Full
----

On the other end of the spectrum you can get the full created object back in the response to your request by including the header :code:`Prefer: return=representation`. That way you won't have to make another HTTP call to discover properties that may have been filled in on the server side. You can also apply the standard :ref:`v_filter` to these results.

.. code-block:: bash

  curl -i "http://localhost:3000/projects" -X POST \
    -H "Content-Type: application/json" \
    -H "Prefer: return=representation" \
    -d '{"id":33, "name": "x"}'

.. code-block:: http

  HTTP/1.1 201 Created
  Preference-Applied: return=representation

.. code-block:: json

  [
      {
          "id": 33,
          "name": "x"
      }
  ]

.. _prefer_tx:

Transaction End Preference
==========================

The ``tx`` preference can be set to specify if the :ref:`transaction <transactions>` will end in a COMMIT or ROLLBACK. This preference is not enabled by default but can be activated with :ref:`db-tx-end`.

.. code-block:: bash

  curl -i "http://localhost:3000/projects" -X POST \
    -H "Content-Type: application/json" \
    -H "Prefer: tx=rollback, return=representation" \
    -d '{"name": "Project X"}'

.. code-block:: http

  HTTP/1.1 200 OK
  Preference-Applied: tx=rollback, return=representation

  {"id": 35, "name": "Project X"}


.. _prefer_missing:

Missing
=======

When doing ``POST`` and ``PATCH`` requests, any missing columns in the payload will be inserted as ``null`` value by default. To use the ``DEFAULT`` column value instead, use the ``Prefer: missing=default`` header.

Having:

.. code-block:: postgres

  create table foo (
    id bigint generated by default as identity primary key
  , bar text
  , baz int default 100
  );

A request:

.. code-block:: bash

  curl "http://localhost:3000/foo?columns=id,bar,baz" \
    -H "Content-Type: application/json" \
    -H "Prefer: missing=default, return=representation" \
    -d @- << EOF
      [
        { "bar": "val1" },
        { "bar": "val2", "baz": 15 }
      ]
  EOF

Will result in:

.. code-block:: json

  [
    { "id":  1, "bar": "val1", "baz": 100 },
    { "id":  2, "bar": "val2", "baz": 15 }
  ]


.. _prefer_max_affected:

Max Affected
============

You can set a limit to the amount of resources affected in a request by sending ``max-affected`` preference. This feature works in combination with ``handling=strict`` preference. ``max-affected`` would be ignored with lenient handling. The "affected resources" are the number of rows returned by ``DELETE`` and ``PATCH`` requests.

To illustrate the use of this preference, consider the following scenario where the ``items`` table contains 14 rows.

.. code-block:: bash

  curl -i "http://localhost:3000/items?id=lt.15 -X DELETE \
    -H "Content-Type: application/json" \
    -H "Prefer: handling=strict, max-affected=10"

.. code-block:: http

  HTTP/1.1 400 Bad Request

.. code-block:: json

  {
      "code": "PGRST124",
      "message": "Query result exceeds max-affected preference constraint",
      "details": "The query affects 14 rows",
      "hint": null
  }

With :ref:`RPC <functions>`, the preference is honored completely on the basis of the number of rows returned in the result set of the function. This can be useful for complex mutation queries using `data-modifying statements <https://www.postgresql.org/docs/current/queries-with.html#QUERIES-WITH-MODIFYING>`_. A simple example:

.. code-block:: postgres

  CREATE FUNCTION test.delete_items()
  RETURNS SETOF items AS $$
    DELETE FROM items WHERE id < 15 RETURNING *;
  $$ LANGUAGE SQL;

.. code-block:: bash

  curl -i "http://localhost:3000/rpc/delete_items" \
    -H "Content-Type: application/json" \
    -H "Prefer: handling=strict, max-affected=10"

.. code-block:: http

  HTTP/1.1 400 Bad Request

.. code-block:: json

  {
      "code": "PGRST124",
      "message": "Query result exceeds max-affected preference constraint",
      "details": "The query affects 14 rows",
      "hint": null
  }

.. note::

  It is important for functions to return ``SETOF`` or ``TABLE`` when called with ``max-affected`` preference. A violation of this would cause a :ref:`PGRST128 <pgrst128>` error.
