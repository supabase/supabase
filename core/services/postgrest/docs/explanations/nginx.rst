.. _nginx:

Nginx
=====

PostgREST is a fast way to construct a RESTful API. Its default behavior is great for scaffolding in development. When it's time to go to production it works great too, as long as you take precautions.
PostgREST is a small sharp tool that focuses on performing the API-to-database mapping. We rely on a reverse proxy like Nginx for additional safeguards.

The first step is to create an Nginx configuration file that proxies requests to an underlying PostgREST server.

.. code-block:: nginx

  http {
    # ...
    # upstream configuration
    upstream postgrest {
      server localhost:3000;
    }
    # ...
    server {
      # ...
      # expose to the outside world
      location /api/ {
        default_type  application/json;
        proxy_hide_header Content-Location;
        add_header Content-Location  /api/$upstream_http_content_location;
        proxy_set_header  Connection "";
        proxy_http_version 1.1;
        proxy_pass http://postgrest/;
      }
      # ...
    }
  }

.. note::

  For ubuntu, if you already installed nginx through :code:`apt` you can add this to the config file in
  :code:`/etc/nginx/sites-enabled/default`.

.. _https:

HTTPS
-----

PostgREST aims to do one thing well: add an HTTP interface to a PostgreSQL database. To keep the code small and focused we do not implement HTTPS. Use a reverse proxy such as NGINX to add this, `here's how <https://nginx.org/en/docs/http/configuring_https_servers.html>`_.

Rate Limiting
-------------

Nginx supports "leaky bucket" rate limiting (see `official docs <https://nginx.org/en/docs/http/ngx_http_limit_req_module.html>`_). Using standard Nginx configuration, routes can be grouped into *request zones* for rate limiting. For instance we can define a zone for login attempts:

.. code-block:: nginx

  limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

This creates a shared memory zone called "login" to store a log of IP addresses that access the rate limited urls. The space reserved, 10 MB (:code:`10m`) will give us enough space to store a history of 160k requests. We have chosen to allow only allow one request per second (:code:`1r/s`).

Next we apply the zone to certain routes, like a hypothetical function called :code:`login`.

.. code-block:: nginx

  location /rpc/login/ {
    # apply rate limiting
    limit_req zone=login burst=5;
  }

The burst argument tells Nginx to start dropping requests if more than five queue up from a specific IP.

Nginx rate limiting is general and indiscriminate. To rate limit each authenticated request individually you will need to add logic in a :ref:`Custom Validation <custom_validation>` function.

Alternate URL Structure
-----------------------

As discussed in :ref:`singular_plural`, there are no special URL forms for singular resources in PostgREST, only operators for filtering. Thus there are no URLs like :code:`/people/1`. It would be specified instead as

.. code-block:: bash

  curl "http://localhost:3000/people?id=eq.1" \
    -H "Accept: application/vnd.pgrst.object+json"

This allows compound primary keys and makes the intent for singular response independent of a URL convention.

Nginx rewrite rules allow you to simulate the familiar URL convention. The following example adds a rewrite rule for all table endpoints, but you'll want to restrict it to those tables that have a numeric simple primary key named "id."

.. code-block:: nginx

  # support /endpoint/:id url style
  location ~ ^/([a-z_]+)/([0-9]+) {

    # make the response singular
    proxy_set_header Accept 'application/vnd.pgrst.object+json';

    # assuming an upstream named "postgrest"
    proxy_pass http://postgrest/$1?id=eq.$2;

  }

.. TODO
.. Administration
..   API Versioning
..   HTTP Caching
..   Upgrading
