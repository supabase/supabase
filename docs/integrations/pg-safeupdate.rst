pg-safeupdate
#############

.. _block_fulltable:

Block Full-Table Operations
---------------------------

If the :ref:`active role <user_impersonation>` can delete table rows then the DELETE verb is allowed for clients. Here's an API request to delete old rows from a hypothetical logs table:

.. code-block:: bash

  curl "http://localhost:3000/logs?time=lt.1991-08-06" -X DELETE

Note that it's very easy to delete the **entire table** by omitting the query parameter!

.. code-block:: bash

  curl "http://localhost:3000/logs" -X DELETE

This can happen accidentally such as by switching a request from a GET to a DELETE. To protect against accidental operations use the `pg-safeupdate <https://github.com/eradman/pg-safeupdate>`_ PostgreSQL extension. It raises an error if UPDATE or DELETE are executed without specifying conditions. To install it you can use the `PGXN <https://pgxn.org/>`_ network:

.. code-block:: bash

  sudo -E pgxn install safeupdate

  # then add this to postgresql.conf:
  # shared_preload_libraries='safeupdate';

This does not protect against malicious actions, since someone can add a url parameter that does not affect the result set. To prevent this you must turn to database permissions, forbidding the wrong people from deleting rows, and using `row-level security <https://www.postgresql.org/docs/current/ddl-rowsecurity.html>`_ if finer access control is required.
