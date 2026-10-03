.. _vary_header:

Vary Header
===========

In order to assist caching proxies and CDNs, PostgREST includes a ``Vary`` header of value
``Accept, Prefer, Range`` in its responses which should fit most of the bills. As any other
response header, it's available for override
by updating ``response.headers`` GUC variable accordingly, for example:

.. code-block:: postgres

   -- Override the Vary header to include Accept, Prefer and X-Test-Vary headers
   perform set_config('response.headers', '[{"Vary": "Accept, Prefer, X-Test-Vary"}]', true);

In this case PostgREST will use provided value verbatim.
