.. _open-api:

OpenAPI
=======

PostgREST automatically serves a full `OpenAPI <https://www.openapis.org/>`_ description on the root path. This provides a list of all endpoints (tables, foreign tables, views, functions), along with supported HTTP verbs and example payloads.

.. note::

  By default, this output depends on the permissions of the role that is contained in the JWT role claim (or the :ref:`db-anon-role` if no JWT is sent). If you need to show all the endpoints disregarding the role's permissions, set the :ref:`openapi-mode` config to :code:`ignore-privileges`.

For extra customization, the OpenAPI output contains a "description" field for every `SQL comment <https://www.postgresql.org/docs/current/sql-comment.html>`_ on any database object. For instance,

.. code-block:: postgres

  COMMENT ON SCHEMA mammals IS
    'A warm-blooded vertebrate animal of a class that is distinguished by the secretion of milk by females for the nourishment of the young';

  COMMENT ON TABLE monotremes IS
    'Freakish mammals lay the best eggs for breakfast';

  COMMENT ON VIEW monotremes_v IS
    'Only the platypus is publicly visible';

  COMMENT ON COLUMN monotremes.has_venomous_claw IS
    'Sometimes breakfast is not worth it';

These unsavory comments will appear in the generated JSON as the fields, ``info.description``, ``definitions.monotremes.description`` and ``definitions.monotremes.properties.has_venomous_claw.description``.

Also if you wish to generate a ``summary`` field you can do it by having a multiple line comment, the ``summary`` will be the first line and the ``description`` the lines that follow it:

.. code-block:: postgres

  COMMENT ON TABLE entities IS
    $$Entities summary

    Entities description that
    spans
    multiple lines$$;

Similarly, you can override the API title by commenting the schema.

.. code-block:: postgres

  COMMENT ON SCHEMA api IS
  $$FooBar API

  A RESTful API that serves FooBar data.$$;

If you need to include the ``security`` and ``securityDefinitions`` options, set the :ref:`openapi-security-active` configuration to ``true``.

You can use a tool like `Swagger UI <https://swagger.io/tools/swagger-ui/>`_ to create beautiful documentation from the description and to host an interactive web-based dashboard. The dashboard allows developers to make requests against a live PostgREST server, and provides guidance with request headers and example request bodies.

.. important::

  The OpenAPI information can go out of date as the schema changes under a running server. See :ref:`schema_reloading`.

.. _override_openapi:

Overriding Full OpenAPI Response
--------------------------------

You can override the whole default response with a function result. To do this, set the function on :ref:`db-root-spec`.

.. code:: bash

   db-root-spec = "root"

.. code:: postgres

  create or replace function root() returns json as $_$
  declare
  openapi json = $$
    {
      "swagger": "2.0",
      "info":{
        "title":"Overridden",
        "description":"This is a my own API"
      }
    }
  $$;
  begin
    return openapi;
  end
  $_$ language plpgsql;

.. code-block:: bash

  curl http://localhost:3000

.. code-block:: http

  HTTP/1.1 200 OK

  {
    "swagger": "2.0",
    "info":{
      "title":"Overridden",
      "description":"This is a my own API"
    }
  }
