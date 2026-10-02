.. _cors:

CORS
####

By default, PostgREST sets highly permissive cross origin resource sharing, that is why it accepts Ajax requests from any domain. This behavior can be configured by using :ref:`server_cors_allowed_origins`.


It also handles `preflight requests <https://developer.mozilla.org/en-US/docs/Glossary/Preflight_request>`_ done by the browser, which are cached using the returned ``Access-Control-Max-Age: 86400`` header (86400 seconds = 24 hours). This is useful to reduce the latency of the subsequent requests.

A ``POST`` preflight request would look like this:

.. code-block:: bash

  curl -i "http://localhost:3000/items" \
    -X OPTIONS \
    -H "Origin: http://example.com" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type"

.. code-block:: http

  HTTP/1.1 200 OK
  Access-Control-Allow-Origin: http://example.com
  Access-Control-Allow-Credentials: true
  Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS, HEAD
  Access-Control-Allow-Headers: Authorization, Content-Type, Accept, Accept-Language, Content-Language
  Access-Control-Max-Age: 86400

.. _allowed_origins:

Allowed Origins
===============

With the following config setting, PostgREST will accept CORS requests from domains :code:`http://example.com` and :code:`http://example2.com`.


.. code-block::
  
  server-cors-allowed-origins="http://example.com, http://example2.com"
