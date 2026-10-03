.. _aggregate_functions:

Aggregate Functions
###################

PostgREST supports the following aggregate functions: ``avg()``, ``count()``, ``max()``, ``min()``, and ``sum()``.
Please refer to the `section on aggregate functions in the PostgreSQL documentation <https://www.postgresql.org/docs/current/functions-aggregate.html>`_ for a detailed explanation of these functions.

.. note::
 Aggregate functions are *disabled* by default in PostgREST, because they can create performance problems without appropriate safeguards.
 See :ref:`db-aggregates-enabled` for further details.

To use an aggregate function, append it to a column in the ``select`` parameter, like so:

.. code-block:: bash

  curl "http://localhost:3000/orders?select=amount.sum()"

This will return a ``sum`` of all the values of the ``amount`` column in a single row:

.. code-block:: json

  [
    {
      "sum": 1234.56
    }
  ]

You can ``select`` multiple aggregate functions at the same time (you may need to :ref:`rename them <renaming_columns>` to disambiguate).

.. code-block:: bash

  curl "http://localhost:3000/orders?select=total_amount:amount.sum(),avg_amount:amount.avg(),total_quantity:quantity.sum()"

.. note::
  Aggregate functions work alongside other PostgREST features, like :ref:`h_filter`, :ref:`json_columns`, and :ref:`ordering`.
  However they are not compatible with :ref:`domain_reps` for the moment.
  Additionally, PostgreSQL's ``HAVING`` clause and ordering by aggregated columns are not yet supported.

Automatic ``GROUP BY``
======================

In SQL, a ``GROUP BY`` clause is required to aggregate the selected columns.
However, PostgREST handles grouping automatically if the columns are already present in the ``select`` parameter.
For instance:

.. code-block:: bash

  curl "http://localhost:3000/orders?select=amount.sum(),amount.avg(),order_date"

This will get the sum and average of the amounts grouped by each unique value in the ``order_date`` column:

.. code-block:: json

  [
    {
      "sum": 1234.56,
      "avg": 123.45,
      "order_date": "2023-01-01"
    },
    {
      "sum": 2345.67,
      "avg": 234.56,
      "order_date": "2023-01-02"
    }
  ]

The ``count()`` Aggregate
=========================

.. note::
  Before the addition of aggregate functions, it was possible to count by adding ``count`` (without parentheses) to the ``select`` parameter.
  While this is still supported, it may be deprecated in the future, and thus use of this legacy feature is **not recommended**.
  Please use ``count()`` (with parentheses) instead.

``count()`` is a special case because it can be used with or without an aggregated column. For example:

.. code-block:: bash

  curl "http://localhost:3000/orders?select=count(),observation_count:observation.count(),order_date"

.. code-block:: json

  [
    {
      "count": 4,
      "observation_count": 2,
      "order_date": "2023-01-01"
    },
    {
      "count": 2,
      "observation_count": 1,
      "order_date": "2023-01-02"
    }
  ]

Note that there is a difference between the result of ``count()`` and ``observation.count()``.
The former counts the whole row, while the latter counts the non ``NULL`` values of the ``observation`` column (both grouped by ``order_date``).
This is due to how PostgreSQL itself implements the ``count()`` function.

Casting Aggregates
==================

It is :ref:`possible to cast <casting_columns>` the aggregated column or the aggregate itself, or both at the same time.

Casting the Aggregated Column
-----------------------------

For example, let's say that ``orders`` has an ``order_details`` :ref:`JSON column <json_columns>` with a ``tax_amount`` key.
We cannot sum ``tax_amount`` directly because using ``->`` or ``->>`` will return the data in ``json`` or ``text`` format.
So we need to cast it to a compatible type (e.g. ``numeric``) right before the aggregate function:

.. code-block:: bash

  curl "http://localhost:3000/orders?select=order_details->tax_amount::numeric.sum()"

.. code-block:: json

  [
    {
      "sum": 1234.56
    }
  ]

Casting the Aggregate
---------------------

For instance, if we wanted to round the average of the ``amount`` column, we could do so by casting ``avg()`` to an ``int``:

.. code-block:: bash

  curl "http://localhost:3000/orders?select=amount.avg()::int"

.. code-block:: json

  [
    {
      "avg": 201
    }
  ]

Aggregates and Resource Embedding
=================================

You can group an aggregate function by an :ref:`embedded resource <resource_embedding>` and also use the aggregates inside them.

Grouping by an Embedded Resource
--------------------------------

Similar to grouping by columns, aggregate functions can also be grouped by embedded resources.
For example, let's say that the ``orders`` table is related to a ``customers`` table.
To get the sum of the ``amount`` column grouped by the ``name`` column from the ``customers`` table, we would do the following:

.. code-block:: bash

  curl "http://localhost:3000/orders?select=amount.sum(),customers(name)"

.. code-block:: json

  [
    {
      "sum": 100,
      "customers": {
        "name": "Customer A"
      }
    },
    {
      "sum": 200,
      "customers": {
        "name": "Customer B"
      }
    }
  ]

The previous example uses a "to-one" relationship, but this can be done on "to-many" relationships as well (although there are few obvious use cases).

This also works in a similar way for :ref:`spread embedded resources <spread_embed>`.
For example, ``select=amount.sum(),...customers(name)`` would sum the ``amount`` grouped by the ``name`` column.

Using Aggregates Inside Embedded Resources
------------------------------------------

Using the relationship from the previous example, let's take all the ``customers`` and embed their ``orders``.
If we also want to get the total ``amount`` grouped by the ``order_date`` of the ``orders``, we would do the following:

.. code-block:: bash

  curl "http://localhost:3000/customers?select=name,city,state,orders(amount.sum(),order_date)"

.. code-block:: json

  [
    {
      "name": "Customer A",
      "city": "New York",
      "state": "NY",
      "orders": [
        {
          "sum": 215.22,
          "order_date": "2023-09-01"
        },
        {
          "sum": 905.73,
          "order_date": "2023-09-02"
        }
      ]
    },
    {
      "name": "Customer B",
      "city": "Los Angeles",
      "state": "CA",
      "orders": [
        {
          "sum": 329.71,
          "order_date": "2023-09-01"
        },
        {
          "sum": 425.87,
          "order_date": "2023-09-03"
        }
      ]
    }
  ]

Note that the aggregate is done within the embedded resource ``orders``.
It is not affected by any of the columns from the top-level relationship ``customers``.

Aggregates in To-One Spreads
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

All the aggregates inside a :ref:`one-to-one or many-to-one spread embedded resource <spread_to_one_embed>` will be hoisted to the top-level relationship.
In other words, it will behave as if the aggregate was done in the top-level relationship itself. For example:

.. code-block:: bash

  curl "http://localhost:3000/orders?select=order_date,...customers(subscription_date.max(),subscription_date.min())

This will take the ``max`` and ``min`` subscription date of every customer and group it by the ``order_date`` column:

.. code-block:: json

  [
    {
      "order_date": "2023-11-01",
      "max": "2023-10-15",
      "min": "2013-10-01"
    },
    {
      "order_date": "2023-11-02",
      "max": "2023-10-30",
      "min": "2016-02-11"
    }
  ]

.. note::

  Aggregates inside to-many spreads are not supported
