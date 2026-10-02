.. note::

  This page is a work in progress.

.. _url_grammar:

URL Grammar
===========

.. _custom_queries:

Custom Queries
--------------

The PostgREST URL grammar limits the kinds of queries clients can perform. It prevents arbitrary, potentially poorly constructed and slow client queries. It's good for quality of service, but means database administrators must create custom views and functions to provide richer endpoints. The most common causes for custom endpoints are

* SET operators like `UNION, INTERSECT and EXCEPT <https://www.postgresql.org/docs/current/queries-union.html>`_.
* More complicated joins than those provided by :ref:`resource_embedding`.
* Geo-spatial queries that require an argument, like "points near (lat,lon)"

Unicode support
---------------

PostgREST supports unicode in schemas, tables, columns and values. To access a table with unicode name, use percent encoding.

To request this:

.. code-block:: http

  GET /موارد HTTP/1.1

Do this:

.. code-block:: bash

  curl "http://localhost:3000/%D9%85%D9%88%D8%A7%D8%B1%D8%AF"

.. _tabs-cols-w-spaces:

Table / Columns with spaces
~~~~~~~~~~~~~~~~~~~~~~~~~~~

You can request table/columns with spaces in them by percent encoding the spaces with ``%20``:

.. code-block:: bash

  curl "http://localhost:3000/Order%20Items?Unit%20Price=lt.200"

.. _reserved-chars:

Reserved characters
~~~~~~~~~~~~~~~~~~~

If filters include PostgREST reserved characters(``,``, ``.``, ``:``, ``*``, ``(``, ``)``) you'll have to surround them in percent encoded double quotes ``%22`` for correct processing.

Here ``Hebdon,John`` and ``Williams,Mary`` are values.

.. code-block:: bash

  curl "http://localhost:3000/employees?name=in.(%22Hebdon,John%22,%22Williams,Mary%22)"

Here ``information.cpe`` is a column name.

.. code-block:: bash

  curl "http://localhost:3000/vulnerabilities?%22information.cpe%22=like.*MS*"

If the value filtered by the ``in`` operator has a double quote (``"``), you can escape it using a backslash ``"\""``. A backslash itself can be used with a double backslash ``"\\"``.

Here ``Quote:"`` and ``Backslash:\`` are percent-encoded values. Note that ``%5C`` is the percent-encoded backslash.

.. code-block:: bash

  curl "http://localhost:3000/marks?name=in.(%22Quote:%5C%22%22,%22Backslash:%5C%5C%22)"

.. note::

   Some HTTP libraries might encode URLs automatically(e.g. :code:`axios`). In these cases you should use double quotes
   :code:`""` directly instead of :code:`%22`.
