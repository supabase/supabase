.. _options_requests:

OPTIONS method
==============

You can verify which HTTP methods are allowed on endpoints for tables and views by using an OPTIONS request. These methods are allowed depending on what operations *can* be done on the table or view, not on the database permissions assigned to them.

For a table named ``people``, OPTIONS would show:

.. code-block:: bash

  curl "http://localhost:3000/people" -X OPTIONS -i

.. code-block:: http

  HTTP/1.1 200 OK
  Allow: OPTIONS,GET,HEAD,POST,PUT,PATCH,DELETE

For a view, the methods are determined by the presence of INSTEAD OF TRIGGERS.

.. table::
   :widths: auto

   +--------------------+-------------------------------------------------------------------------------------------------+
   | Method allowed     | View's requirements                                                                             |
   +====================+=================================================================================================+
   | OPTIONS, GET, HEAD | None (Always allowed)                                                                           |
   +--------------------+-------------------------------------------------------------------------------------------------+
   | POST               | INSTEAD OF INSERT TRIGGER                                                                       |
   +--------------------+-------------------------------------------------------------------------------------------------+
   | PUT                | INSTEAD OF INSERT TRIGGER, INSTEAD OF UPDATE TRIGGER, also requires the presence of a           |
   |                    | primary key                                                                                     |
   +--------------------+-------------------------------------------------------------------------------------------------+
   | PATCH              | INSTEAD OF UPDATE TRIGGER                                                                       |
   +--------------------+-------------------------------------------------------------------------------------------------+
   | DELETE             | INSTEAD OF DELETE TRIGGER                                                                       |
   +--------------------+-------------------------------------------------------------------------------------------------+
   | All the above methods are allowed for                                                                                |
   | `auto-updatable views <https://www.postgresql.org/docs/current/sql-createview.html#SQL-CREATEVIEW-UPDATABLE-VIEWS>`_ |
   +--------------------+-------------------------------------------------------------------------------------------------+

For functions, the methods depend on their volatility. ``VOLATILE`` functions allow only ``OPTIONS,POST``, whereas the rest also permit ``GET,HEAD``.

.. important::

  Whenever you add or remove tables or views, or modify a view's INSTEAD OF TRIGGERS on the database, you must refresh PostgREST's schema cache for OPTIONS requests to work properly. See the section :ref:`schema_reloading`.
