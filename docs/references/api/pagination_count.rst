Pagination and Count
####################

Pagination controls the number of rows returned for an :doc:`API resource <../api>` response. Combined with the count, you can traverse all the rows of a response.

.. _limits:

Limits and Pagination
---------------------

PostgREST uses HTTP range headers to describe the size of results. Every response contains the current range and, if requested, the total number of results:

.. code-block:: http

  HTTP/1.1 200 OK
  Range-Unit: items
  Content-Range: 0-14/*

Here items zero through fourteen are returned. This information is available in every response and can help you render pagination controls on the client. This is an RFC7233-compliant solution that keeps the response JSON cleaner.

Query Parameters
~~~~~~~~~~~~~~~~

One way to request limits and offsets is by using query parameters. For example:

.. code-block:: bash

  curl "http://localhost:3000/people?limit=15&offset=30"

This method is also useful for embedded resources, which we will cover in another section. The server always responds with range headers even if you use query parameters to limit the query.

Range Header
~~~~~~~~~~~~

You can use headers to specify the range of rows desired.
This request gets the first twenty people:

.. code-block:: bash

  curl "http://localhost:3000/people" -i \
    -H "Range-Unit: items" \
    -H "Range: 0-19"

Note that the server may respond with fewer if unable to meet your request:

.. code-block:: http

  HTTP/1.1 200 OK
  Range-Unit: items
  Content-Range: 0-17/*

You may also request open-ended ranges for an offset with no limit, e.g. :code:`Range: 10-`.

.. _prefer_count:

Counting
--------

In order to obtain the total size of the table (such as when rendering the last page link in a pagination control), you can specify a ``Prefer: count=<value>`` header. The values can be ``exact``, ``planned`` and ``estimated``.

This also works on views and :ref:`table_functions`.


.. _exact_count:

Exact Count
~~~~~~~~~~~

To get the exact count, use ``Prefer: count=exact``.

.. code-block:: bash

  curl "http://localhost:3000/bigtable" -I \
    -H "Range-Unit: items" \
    -H "Range: 0-24" \
    -H "Prefer: count=exact"

Note that the larger the table the slower this query runs in the database. The server will respond with the selected range and total

.. code-block:: http

  HTTP/1.1 206 Partial Content
  Range-Unit: items
  Content-Range: 0-24/3573458

.. _planned_count:

Planned Count
~~~~~~~~~~~~~

To avoid the shortcomings of :ref:`exact count <exact_count>`, PostgREST can leverage PostgreSQL statistics and get a fairly accurate and fast count.
To do this, specify the ``Prefer: count=planned`` header.

.. code-block:: bash

  curl "http://localhost:3000/bigtable?limit=25" -I \
    -H "Prefer: count=planned"

.. code-block:: http

  HTTP/1.1 206 Partial Content
  Content-Range: 0-24/3572000

Note that the accuracy of this count depends on how up-to-date are the PostgreSQL statistics tables.
For example in this case, to increase the accuracy of the count you can do ``ANALYZE bigtable``.
See `ANALYZE <https://www.postgresql.org/docs/current/sql-analyze.html>`_ for more details.

.. _estimated_count:

Estimated Count
~~~~~~~~~~~~~~~

When you are interested in the count, the relative error is important. If you have a :ref:`planned count <planned_count>` of 1000000 and the exact count is
1001000, the error is small enough to be ignored. But with a planned count of 7, an exact count of 28 would be a huge misprediction.

In general, when having smaller row-counts, the estimated count should be as close to the exact count as possible.

To help with these cases, PostgREST can get the exact count up until a threshold and get the planned count when
that threshold is surpassed. To use this behavior, you can specify the ``Prefer: count=estimated`` header. The **threshold** is
defined by :ref:`db-max-rows`.

Here's an example. Suppose we set ``db-max-rows=1000`` and ``smalltable`` has 321 rows, then we'll get the exact count:

.. code-block:: bash

  curl "http://localhost:3000/smalltable?limit=25" -I \
    -H "Prefer: count=estimated"

.. code-block:: http

  HTTP/1.1 206 Partial Content
  Content-Range: 0-24/321

If we make a similar request on ``bigtable``, which has 3573458 rows, we would get the planned count:

.. code-block:: bash

  curl "http://localhost:3000/bigtable?limit=25" -I \
    -H "Prefer: count=estimated"

.. code-block:: http

  HTTP/1.1 206 Partial Content
  Content-Range: 0-24/3572000
