.. _error_source:

Errors
######

PostgREST error messages follow the PostgreSQL error structure. It includes ``MESSAGE``, ``DETAIL``, ``HINT``, ``ERRCODE`` and will add an HTTP status code to the response.

.. _postgresql_errors:

Errors from PostgreSQL
======================

PostgREST will forward errors coming from PostgreSQL. For instance, on a failed constraint:

.. code-block:: http

  POST /projects HTTP/1.1

.. code-block:: http

  HTTP/1.1 400 Bad Request
  Content-Type: application/json; charset=utf-8

.. code-block:: json


  {
      "code": "23502",
      "details": "Failing row contains (null, foo, null).",
      "hint": null,
      "message": "null value in column \"id\" of relation \"projects\" violates not-null constraint"
  }

.. _status_codes:

HTTP Status Codes
-----------------

PostgREST translates `PostgreSQL error codes <https://www.postgresql.org/docs/current/errcodes-appendix.html>`_ into HTTP status as follows:

+--------------------------+-------------------------+---------------------------------+
| PostgreSQL error code(s) | HTTP status             | Error description               |
+==========================+=========================+=================================+
| 08*                      | 503                     | pg connection err               |
+--------------------------+-------------------------+---------------------------------+
| 09*                      | 500                     | triggered action exception      |
+--------------------------+-------------------------+---------------------------------+
| 0L*                      | 403                     | invalid grantor                 |
+--------------------------+-------------------------+---------------------------------+
| 0P*                      | 403                     | invalid role specification      |
+--------------------------+-------------------------+---------------------------------+
| 23503                    | 409                     | foreign key violation           |
+--------------------------+-------------------------+---------------------------------+
| 23505                    | 409                     | uniqueness violation            |
+--------------------------+-------------------------+---------------------------------+
| 25006                    | 405                     | read only sql transaction       |
+--------------------------+-------------------------+---------------------------------+
| 25*                      | 500                     | invalid transaction state       |
+--------------------------+-------------------------+---------------------------------+
| 28*                      | 403                     | invalid auth specification      |
+--------------------------+-------------------------+---------------------------------+
| 2D*                      | 500                     | invalid transaction termination |
+--------------------------+-------------------------+---------------------------------+
| 38*                      | 500                     | external routine exception      |
+--------------------------+-------------------------+---------------------------------+
| 39*                      | 500                     | external routine invocation     |
+--------------------------+-------------------------+---------------------------------+
| 3B*                      | 500                     | savepoint exception             |
+--------------------------+-------------------------+---------------------------------+
| 40*                      | 500                     | transaction rollback            |
+--------------------------+-------------------------+---------------------------------+
| 53400                    | 500                     | config limit exceeded           |
+--------------------------+-------------------------+---------------------------------+
| 53*                      | 503                     | insufficient resources          |
+--------------------------+-------------------------+---------------------------------+
| 54*                      | 500                     | too complex                     |
+--------------------------+-------------------------+---------------------------------+
| 55*                      | 500                     | obj not in prerequisite state   |
+--------------------------+-------------------------+---------------------------------+
| 57*                      | 500                     | operator intervention           |
+--------------------------+-------------------------+---------------------------------+
| 58*                      | 500                     | system error                    |
+--------------------------+-------------------------+---------------------------------+
| F0*                      | 500                     | config file error               |
+--------------------------+-------------------------+---------------------------------+
| HV*                      | 500                     | foreign data wrapper error      |
+--------------------------+-------------------------+---------------------------------+
| P0001                    | 400                     | default code for "raise"        |
+--------------------------+-------------------------+---------------------------------+
| P0*                      | 500                     | PL/pgSQL error                  |
+--------------------------+-------------------------+---------------------------------+
| XX*                      | 500                     | internal error                  |
+--------------------------+-------------------------+---------------------------------+
| 42883                    | 404                     | undefined function              |
+--------------------------+-------------------------+---------------------------------+
| 42P01                    | 404                     | undefined table                 |
+--------------------------+-------------------------+---------------------------------+
| 42P17                    | 500                     | infinite recursion              |
+--------------------------+-------------------------+---------------------------------+
| 42501                    | | if authenticated 403, | insufficient privileges         |
|                          | | else 401              |                                 |
+--------------------------+-------------------------+---------------------------------+
| other                    | 400                     |                                 |
+--------------------------+-------------------------+---------------------------------+

Errors from PostgREST
=====================

Errors that come from PostgREST itself maintain the same structure but differ in the ``PGRST`` prefix in the ``code`` field. For instance, when querying a function that does not exist in the :doc:`schema cache <schema_cache>`:

.. code-block:: http

  POST /rpc/nonexistent_function HTTP/1.1

.. code-block:: http

  HTTP/1.1 404 Not Found
  Content-Type: application/json; charset=utf-8

.. code-block:: json

  {
    "hint": "...",
    "details": null
    "code": "PGRST202",
    "message": "Could not find the api.nonexistent_function() function in the schema cache"
  }


.. _pgrst_errors:

PostgREST Error Codes
---------------------

PostgREST error codes have the form ``PGRSTgxx``.

- ``PGRST`` is the prefix that differentiates the error from a PostgreSQL error.
- ``g`` is the error group
- ``xx`` is the error identifier in the group.

.. _pgrst0**:

Group 0 - Connection
~~~~~~~~~~~~~~~~~~~~

Related to the connection with the database.

+---------------+-------------+-------------------------------------------------------------+
| Code          | HTTP status | Description                                                 |
+===============+=============+=============================================================+
| .. _pgrst000: | 503         | Could not connect with the database due to an incorrect     |
|               |             | :ref:`db-uri` or due to the PostgreSQL service not running. |
| PGRST000      |             |                                                             |
+---------------+-------------+-------------------------------------------------------------+
| .. _pgrst001: | 503         | Could not connect with the database due to an internal      |
|               |             | error.                                                      |
| PGRST001      |             |                                                             |
+---------------+-------------+-------------------------------------------------------------+
| .. _pgrst002: | 503         | Could not connect with the database when building the       |
|               |             | :doc:`Schema Cache <schema_cache>`                          |
| PGRST002      |             | due to the PostgreSQL service not running.                  |
+---------------+-------------+-------------------------------------------------------------+
| .. _pgrst003: | 504         | The request timed out waiting for a pool connection         |
|               |             | to be available. See :ref:`db-pool-acquisition-timeout`.    |
| PGRST003      |             |                                                             |
+---------------+-------------+-------------------------------------------------------------+

.. _pgrst1**:

Group 1 - Api Request
~~~~~~~~~~~~~~~~~~~~~

Related to the HTTP request elements.

+---------------+-------------+-------------------------------------------------------------+
| Code          | HTTP status | Description                                                 |
+===============+=============+=============================================================+
| .. _pgrst100: | 400         | Parsing error in the query string parameter.                |
|               |             | See :ref:`h_filter`, :ref:`operators` and :ref:`ordering`.  |
| PGRST100      |             |                                                             |
+---------------+-------------+-------------------------------------------------------------+
| .. _pgrst101: | 405         | For :ref:`functions <functions>`, only ``GET`` and ``POST`` |
|               |             | verbs are allowed. Any other verb will throw this error.    |
| PGRST101      |             |                                                             |
+---------------+-------------+-------------------------------------------------------------+
| .. _pgrst102: | 400         | An invalid request body was sent(e.g. an empty body or      |
|               |             | malformed JSON).                                            |
| PGRST102      |             |                                                             |
+---------------+-------------+-------------------------------------------------------------+
| .. _pgrst103: | 416         | An invalid range was specified for :ref:`limits`.           |
|               |             |                                                             |
| PGRST103      |             |                                                             |
+---------------+-------------+-------------------------------------------------------------+
| .. _pgrst105: | 405         | An invalid :ref:`PUT <upsert_put>` request was done         |
|               |             |                                                             |
| PGRST105      |             |                                                             |
+---------------+-------------+-------------------------------------------------------------+
| .. _pgrst106: | 406         | The schema specified when                                   |
|               |             | :ref:`switching schemas <multiple-schemas>` is not present  |
| PGRST106      |             | in the :ref:`db-schemas` configuration variable.            |
+---------------+-------------+-------------------------------------------------------------+
| .. _pgrst107: | 406         | The ``Accept`` media type sent in the request is invalid.   |
|               |             |                                                             |
| PGRST107      |             |                                                             |
+---------------+-------------+-------------------------------------------------------------+
| .. _pgrst108: | 400         | The filter is applied to a embedded resource that is not    |
|               |             | specified in the ``select`` part of the query string.       |
| PGRST108      |             | See :ref:`embed_filters`.                                   |
+---------------+-------------+-------------------------------------------------------------+
| .. _pgrst111: | 500         | An invalid ``response.headers`` was set.                    |
|               |             | See :ref:`guc_resp_hdrs`.                                   |
| PGRST111      |             |                                                             |
+---------------+-------------+-------------------------------------------------------------+
| .. _pgrst112: | 500         | The status code must be a positive integer.                 |
|               |             | See :ref:`guc_resp_status`.                                 |
| PGRST112      |             |                                                             |
+---------------+-------------+-------------------------------------------------------------+
| .. _pgrst114: | 400         | For an :ref:`UPSERT using PUT <upsert_put>`, when           |
|               |             | :ref:`limits and offsets <limits>` are used.                |
| PGRST114      |             |                                                             |
+---------------+-------------+-------------------------------------------------------------+
| .. _pgrst115: | 400         | For an :ref:`UPSERT using PUT <upsert_put>`, when the       |
|               |             | primary key in the query string and the body are different. |
| PGRST115      |             |                                                             |
+---------------+-------------+-------------------------------------------------------------+
| .. _pgrst116: | 406         | More than 1 or no items where returned when requesting      |
|               |             | a singular response. See :ref:`singular_plural`.            |
| PGRST116      |             |                                                             |
+---------------+-------------+-------------------------------------------------------------+
| .. _pgrst117: | 405         | The HTTP verb used in the request in not supported.         |
|               |             |                                                             |
| PGRST117      |             |                                                             |
+---------------+-------------+-------------------------------------------------------------+
| .. _pgrst118: | 400         | Could not order the result using the related table because  |
|               |             | there is no many-to-one or one-to-one relationship between  |
| PGRST118      |             | them.                                                       |
+---------------+-------------+-------------------------------------------------------------+
| .. _pgrst120: | 400         | An embedded resource can only be filtered using the         |
|               |             | ``is.null`` or ``not.is.null`` :ref:`operators <operators>`.|
| PGRST120      |             |                                                             |
+---------------+-------------+-------------------------------------------------------------+
| .. _pgrst121: | 500         | PostgREST can't parse the JSON objects in RAISE             |
|               |             | ``PGRST`` error. See :ref:`raise headers <raise_headers>`.  |
| PGRST121      |             |                                                             |
+---------------+-------------+-------------------------------------------------------------+
| .. _pgrst122: | 400         | Invalid preferences found in ``Prefer`` header with         |
|               |             | ``Prefer: handling=strict``. See :ref:`prefer_handling`.    |
| PGRST122      |             |                                                             |
+---------------+-------------+-------------------------------------------------------------+
| .. _pgrst123: | 400         | Aggregate functions are disabled.                           |
|               |             | See :ref:`db-aggregates-enabled`.                           |
| PGRST123      |             |                                                             |
+---------------+-------------+-------------------------------------------------------------+
| .. _pgrst124: | 400         | ``max-affected`` preference is violated.                    |
|               |             | See :ref:`prefer_max_affected`.                             |
| PGRST124      |             |                                                             |
+---------------+-------------+-------------------------------------------------------------+
| .. _pgrst125: | 404         | Invalid path is specified in request URL.                   |
|               |             |                                                             |
| PGRST125      |             |                                                             |
+---------------+-------------+-------------------------------------------------------------+
| .. _pgrst126: | 404         | Open API config is disabled but API root path is            |
|               |             | accessed. See :ref:`openapi-mode`.                          |
| PGRST126      |             |                                                             |
+---------------+-------------+-------------------------------------------------------------+
| .. _pgrst127: | 400         | The feature specified in the ``details`` field is not       |
|               |             | implemented.                                                |
| PGRST127      |             |                                                             |
+---------------+-------------+-------------------------------------------------------------+
| .. _pgrst128: | 400         | ``max-affected`` preference is violated with ``RPC`` call.  |
|               |             | See :ref:`prefer_max_affected`.                             |
| PGRST128      |             |                                                             |
+---------------+-------------+-------------------------------------------------------------+


.. _pgrst2**:

Group 2 - Schema Cache
~~~~~~~~~~~~~~~~~~~~~~

Related to a :ref:`schema_cache`. Most of the time, these errors are solved by :ref:`schema_reloading`.

+---------------+-------------+-------------------------------------------------------------+
| Code          | HTTP status | Description                                                 |
+===============+=============+=============================================================+
| .. _pgrst200: | 400         | Caused by stale foreign key relationships, otherwise any of |
|               |             | the embedding resources or the relationship itself may not  |
| PGRST200      |             | exist in the database.                                      |
+---------------+-------------+-------------------------------------------------------------+
| .. _pgrst201: | 300         | An ambiguous embedding request was made.                    |
|               |             | See :ref:`complex_rels`.                                    |
| PGRST201      |             |                                                             |
+---------------+-------------+-------------------------------------------------------------+
| .. _pgrst202: | 404         | Caused by a stale function signature, otherwise             |
|               |             | the function may not exist in the database.                 |
| PGRST202      |             |                                                             |
+---------------+-------------+-------------------------------------------------------------+
| .. _pgrst203: | 300         | Caused by requesting overloaded functions with the same     |
|               |             | argument names but different types, or by using a ``POST``  |
| PGRST203      |             | verb to request overloaded functions with a ``JSON`` or     |
|               |             | ``JSONB`` type unnamed parameter. The solution is to rename |
|               |             | the function or add/modify the names of the arguments.      |
+---------------+-------------+-------------------------------------------------------------+
| .. _pgrst204: | 400         | Caused when the :ref:`column specified <specify_columns>`   |
|               |             | in the ``columns`` query parameter is not found.            |
| PGRST204      |             |                                                             |
+---------------+-------------+-------------------------------------------------------------+
| .. _pgrst205: | 404         | Caused when the :ref:`table specified <tables_views>` in    |
|               |             | the URI is not found.                                       |
| PGRST205      |             |                                                             |
+---------------+-------------+-------------------------------------------------------------+

.. _pgrst3**:

Group 3 - JWT
~~~~~~~~~~~~~

Related to the authentication process using JWT. You can follow the :ref:`tut1` for an example on how to implement authentication and the :doc:`Authentication page <auth>` for more information on this process.

+---------------+-------------+-------------------------------------------------------------+
| Code          | HTTP status | Description                                                 |
+===============+=============+=============================================================+
| .. _pgrst300: | 500         | A :ref:`JWT secret <jwt-secret>` is missing from the        |
|               |             | configuration.                                              |
| PGRST300      |             |                                                             |
+---------------+-------------+-------------------------------------------------------------+
| .. _pgrst301: | 401         | Provided JWT couldn't be decoded or it is invalid.          |
|               |             |                                                             |
| PGRST301      |             |                                                             |
+---------------+-------------+-------------------------------------------------------------+
| .. _pgrst302: | 401         | Attempted to do a request without                           |
|               |             | :ref:`bearer_auth` when the anonymous role                  |
| PGRST302      |             | is disabled by not setting it in :ref:`db-anon-role`.       |
+---------------+-------------+-------------------------------------------------------------+
| .. _pgrst303: | 401         | :ref:`JWT claims validation <jwt_claims_validation>`        |
|               |             | or parsing failed.                                          |
| PGRST303      |             |                                                             |
+---------------+-------------+-------------------------------------------------------------+

.. The Internal Errors Group X** is always at the end

.. _pgrst_X**:

Group X - Internal
~~~~~~~~~~~~~~~~~~

Internal errors. If you encounter any of these, you may have stumbled on a PostgREST bug, please `open an issue <https://github.com/PostgREST/postgrest/issues>`_ and we'll be glad to fix it.

+---------------+-------------+-------------------------------------------------------------+
| Code          | HTTP status | Description                                                 |
+===============+=============+=============================================================+
| .. _pgrstX00: | 500         | Internal errors related to the library used for connecting  |
|               |             | to the database.                                            |
| PGRSTX00      |             |                                                             |
+---------------+-------------+-------------------------------------------------------------+

.. _custom_errors:

Custom Errors
=============

You can customize the errors by using the `RAISE statement <https://www.postgresql.org/docs/current/plpgsql-errors-and-messages.html#PLPGSQL-STATEMENTS-RAISE>`_  on functions.

.. _raise_error:

RAISE errors with HTTP Status Codes
-----------------------------------

Custom status codes can be done by raising SQL exceptions inside :ref:`functions <functions>`. For instance, here's a saucy function that always responds with an error:

.. code-block:: postgres

  CREATE OR REPLACE FUNCTION just_fail() RETURNS void
    LANGUAGE plpgsql
    AS $$
  BEGIN
    RAISE EXCEPTION 'I refuse!'
      USING DETAIL = 'Pretty simple',
            HINT = 'There is nothing you can do.';
  END
  $$;

Calling the function returns HTTP 400 with the body

.. code-block:: json

  {
    "message":"I refuse!",
    "details":"Pretty simple",
    "hint":"There is nothing you can do.",
    "code":"P0001"
  }

One way to customize the HTTP status code is by raising particular exceptions according to the PostgREST :ref:`error to status code mapping <status_codes>`. For example, :code:`RAISE insufficient_privilege` will respond with HTTP 401/403 as appropriate.

For even greater control of the HTTP status code, raise an exception of the ``PTxyz`` type. For instance to respond with HTTP 402, raise ``PT402``:

.. code-block:: postgres

  RAISE sqlstate 'PT402' using
    message = 'Payment Required',
    detail = 'Quota exceeded',
    hint = 'Upgrade your plan';

Returns:

.. code-block:: http

  HTTP/1.1 402 Payment Required
  Content-Type: application/json; charset=utf-8

  {
    "message": "Payment Required",
    "details": "Quota exceeded",
    "hint": "Upgrade your plan",
    "code": "PT402"
  }

.. _raise_headers:

Add HTTP Headers with RAISE
---------------------------

For full control over headers and status you can raise a ``PGRST`` SQLSTATE error. You can achieve this by adding the ``code``, ``message``, ``detail`` and ``hint`` in the PostgreSQL error message field as a JSON object. Here, the ``details`` and ``hint`` are optional. Similarly, the ``status`` and ``headers`` must be added to the SQL error detail field as a JSON object. For instance:

.. code-block:: postgres

  RAISE sqlstate 'PGRST' USING
      message = '{"code":"123","message":"Payment Required","details":"Quota exceeded","hint":"Upgrade your plan"}',
      detail = '{"status":402,"headers":{"X-Powered-By":"Nerd Rage"}}';

Returns:

.. code-block:: http

  HTTP/1.1 402 Payment Required
  Content-Type: application/json; charset=utf-8
  X-Powered-By: Nerd Rage

  {
    "message": "Payment Required",
    "details": "Quota exceeded",
    "hint": "Upgrade your plan",
    "code": "123"
  }


For non standard HTTP status, you can optionally add ``status_text`` to describe the status code. For status code ``419`` the detail field may look like this:

.. code-block:: postgres

  detail = '{"status":419,"status_text":"Page Expired","headers":{"X-Powered-By":"Nerd Rage"}}';

If PostgREST can't parse the JSON objects ``message`` and ``detail``, it will throw a ``PGRST121`` error. See :ref:`Errors from PostgREST<pgrst1**>`.

.. _proxy-status_header:

Proxy-Status Header
===================

For error cases, the standard `Proxy-Status <https://www.rfc-editor.org/rfc/rfc9209.html#name-the-proxy-status-http-field>`_ header is returned with the error code. The error code comes from either :ref:`PostgREST <pgrst_errors>`, :ref:`PostgreSQL <postgresql_errors>` or :ref:`Custom <custom_errors>` errors. This is useful when doing ``HEAD`` requests where the HTTP status is not descriptive enough.

For example, doing a request on a table with high count (say 30_000_000), we get:

.. code-block:: http

  HEAD /table HTTP/1.1
  Prefer: count=exact

.. code-block:: http

  HTTP/1.1 500 Internal Server Error
  Proxy-Status: PostgREST; error=57014

The PostgreSQL error code ``57014`` (`ref <https://www.postgresql.org/docs/current/errcodes-appendix.html>`_) reveals that the error is due to a short ``statement_timeout`` value.

.. _client_error_verbosity:

Client Error Verbosity
======================

For HTTP clients, the error verbosity can be set via :ref:`client-error-verbosity` config.

With ``verbose``, it returns ``code``, ``message``, ``details`` and ``hint``.

.. code:: bash

  curl "localhost:3000/itemsxx"

.. code-block:: json

  {
      "code": "PGRST205",
      "message": "Could not find the table 'public.itemsxx' in the schema cache",
      "details": "Perhaps you meant the table 'public.items'",
      "hint": null
  }

With ``minimal``, just ``code`` and ``message`` is returned.

.. code:: bash

  curl "localhost:3000/itemsxx"

.. code-block:: json

  {
      "code": "PGRST205",
      "message": "Could not find the table 'public.itemsxx' in the schema cache"
  }
