.. _tut0:

Tutorial 0 - Get it Running
===========================

:author: `begriffs <https://github.com/begriffs>`_

Welcome to PostgREST! In this pre-tutorial we're going to get things running so you can create your first simple API.

PostgREST is a standalone web server which turns a PostgreSQL database into a RESTful API. It serves an API that is customized based on the structure of the underlying database.

.. container:: img-translucent

  .. image:: ../_static/tuts/tut0-request-flow.png

To make an API we'll simply be building a database. All the endpoints and permissions come from database objects like tables, views, roles, and functions. These tutorials will cover a number of common scenarios and how to model them in the database.

By the end of this tutorial you'll have a working database, PostgREST server, and a simple single-user todo list API.

Step 1. Install PostgreSQL
--------------------------

If you're already familiar with using PostgreSQL and have it installed on your system you can use the existing installation (see :ref:`pg-dependency` for minimum requirements). For this tutorial we'll describe how to use the database in Docker because database configuration is otherwise too complicated for a simple tutorial.

If Docker is not installed, you can get it `here <https://www.docker.com/get-started>`_. Make sure that Docker service is `started <https://docs.docker.com/engine/daemon/start/#start-the-daemon-using-operating-system-utilities>`_. Next, let's pull and start the database image:

.. code-block:: bash

  sudo docker run --name tutorial -p 5432:5432 \
                  -e POSTGRES_PASSWORD=notused \
                  -d postgres

This will run the Docker instance as a daemon and expose port 5432 to the host system so that it looks like an ordinary PostgreSQL server to the rest of the system.

.. note::

  This only works if there is no other PostgreSQL instance running on the default port on your computer. If this port is already in use, you will receive a message similar to this:

  .. code-block:: text

    docker: Error response from daemon: [...]: Bind for 0.0.0.0:5432 failed: port is already allocated.

  In this case, you will need to change the **first** of the two 5432 to something else, for example to :code:`5433:5432`. Remember to also adjust the port in your config file in Step 5!


Step 2. Install PostgREST
-------------------------

Using a Package Manager
~~~~~~~~~~~~~~~~~~~~~~~

You can use your OS package manager to install PostgREST.

.. include:: ../shared/installation.rst

Then, try running it with:

.. code-block:: bash

  postgrest -h

It should print the help page with its version and the available options.

Downloading a Pre-Built Binary
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

PostgREST is also distributed as a single binary, with versions compiled for major distributions of macOS, Windows, Linux and FreeBSD. Visit the `latest release <https://github.com/PostgREST/postgrest/releases/latest>`_ for a list of downloads. In the event that your platform is not among those already pre-built, see :ref:`build_source` for instructions how to build it yourself. Also let us know to add your platform in the next release.

The pre-built binaries for download are :code:`.tar.xz` compressed files (except Windows which is a zip file). To extract the binary, go into the terminal and run

.. code-block:: bash

  # download from https://github.com/PostgREST/postgrest/releases/latest

  tar xJf postgrest-<version>-<platform>.tar.xz

The result will be a file named simply :code:`postgrest` (or :code:`postgrest.exe` on Windows). At this point try running it with

.. code-block:: bash

  ./postgrest -h

If everything is working correctly it will print out its version and the available options. You can continue to run this binary from where you downloaded it, or copy it to a system directory like :code:`/usr/local/bin` on Linux so that you will be able to run it from any directory.

.. note::

  PostgREST requires libpq, the PostgreSQL C library, to be installed on your system. Without the library you'll get an error like "error while loading shared libraries: libpq.so.5." Here's how to fix it:

  .. raw:: html

    <p>
    <details>
      <summary>Ubuntu or Debian</summary>
      <div class="highlight-bash"><div class="highlight">
        <pre>sudo apt-get install libpq-dev</pre>
      </div></div>
    </details>
    <details>
      <summary>Fedora, CentOS, or Red Hat</summary>
      <div class="highlight-bash"><div class="highlight">
        <pre>sudo yum install postgresql-libs</pre>
      </div></div>
    </details>
    <details>
      <summary>macOS</summary>
      <div class="highlight-bash"><div class="highlight">
        <pre>brew install postgresql</pre>
      </div></div>
    </details>
    <details>
      <summary>Windows</summary>
        <p>All of the DLL files that are required to run PostgREST are available in the windows installation of PostgreSQL server.
        Once installed they are found in the BIN folder, e.g: C:\Program Files\PostgreSQL\10\bin. Add this directory to your PATH
        variable. Run the following from an administrative command prompt (adjusting the actual BIN path as necessary of course)
          <pre>setx /m PATH "%PATH%;C:\Program Files\PostgreSQL\10\bin"</pre>
        </p>
    </details>
    </p>

Step 3. Create Database for API
-------------------------------

Connect to the SQL console (psql) inside the container. To do so, run this from your command line:

.. code-block:: bash

  sudo docker exec -it tutorial psql -U postgres

You should see the psql command prompt:

::

  psql (16.2)
  Type "help" for help.

  postgres=#

The first thing we'll do is create a `named schema <https://www.postgresql.org/docs/current/ddl-schemas.html>`_ for the database objects which will be exposed in the API. We can choose any name we like, so how about "api." Execute this and the other SQL statements inside the psql prompt you started.

.. code-block:: postgres

  create schema api;

Our API will have one endpoint, :code:`/todos`, which will come from a table.

.. code-block:: postgres

  create table api.todos (
    id int primary key generated by default as identity,
    done boolean not null default false,
    task text not null,
    due timestamptz
  );

  insert into api.todos (task) values
    ('finish tutorial 0'), ('pat self on back');

Next make a role to use for anonymous web requests. When a request comes in, PostgREST will switch into this role in the database to run queries.

.. code-block:: postgres

  create role web_anon nologin;

  grant usage on schema api to web_anon;
  grant select on api.todos to web_anon;

The :code:`web_anon` role has permission to access things in the :code:`api` schema, and to read rows in the :code:`todos` table.

It's a good practice to create a dedicated role for connecting to the database, instead of using the highly privileged ``postgres`` role. So we'll do that, name the role ``authenticator`` and also grant it the ability to switch to the ``web_anon`` role :

.. code-block:: postgres

  create role authenticator noinherit login password 'mysecretpassword';
  grant web_anon to authenticator;


Now quit out of psql; it's time to start the API!

.. code-block:: psql

  \q

Step 4. Run PostgREST
---------------------

PostgREST can use a configuration file to tell it how to connect to the database. Create a file :code:`tutorial.conf` with this inside:

.. code-block:: ini

  db-uri = "postgres://authenticator:mysecretpassword@localhost:5432/postgres"
  db-schemas = "api"
  db-anon-role = "web_anon"

The configuration file has other :ref:`options <configuration>`, but this is all we need.
If you are not using Docker, make sure that your port number is correct and replace `postgres` with the name of the database where you added the todos table.

.. note::

  In case you had to adjust the port in Step 2, remember to adjust the port here, too!

Now run the server:

.. code-block:: bash

  # Running postgrest installed from a package manager
  postgrest tutorial.conf

  # Running postgrest binary
  ./postgrest tutorial.conf

You should see something similar to:

.. code-block:: text

  Starting PostgREST 12.0.2...
  Successfully connected to PostgreSQL 14.10 (Ubuntu 14.10-0ubuntu0.22.04.1) on x86_64-pc-linux-gnu, compiled by gcc (Ubuntu 11.4.0-1ubuntu1~22.04) 11.4.0, 64-bit
  API server listening on port 3000

It's now ready to serve web requests. There are many nice graphical API exploration tools you can use, but for this tutorial we'll use :code:`curl` because it's likely to be installed on your system already. Open a new terminal (leaving the one open that PostgREST is running inside). Try doing an HTTP request for the todos.

.. code-block:: bash

  curl http://localhost:3000/todos

The API replies:

.. code-block:: json

  [
    {
      "id": 1,
      "done": false,
      "task": "finish tutorial 0",
      "due": null
    },
    {
      "id": 2,
      "done": false,
      "task": "pat self on back",
      "due": null
    }
  ]

With the current role permissions, anonymous requests have read-only access to the :code:`todos` table. If we try to add a new todo we are not able.

.. code-block:: bash

  curl http://localhost:3000/todos -X POST \
       -H "Content-Type: application/json" \
       -d '{"task": "do bad thing"}'

Response is 401 Unauthorized:

.. code-block:: json

  {
    "code": "42501",
    "details": null,
    "hint": null,
    "message": "permission denied for table todos"
  }

There we have it, a basic API on top of the database! In the next tutorials we will see how to extend the example with more sophisticated user access controls, and more tables and queries.

Now that you have PostgREST running, try the next tutorial, :ref:`tut1`
