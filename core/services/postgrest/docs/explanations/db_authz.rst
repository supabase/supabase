.. _db_authz:

Database Authorization
######################

Database authorization is the process of granting and verifying database access permissions. PostgreSQL manages permissions using the concept of roles.

Users and Groups
================

A role can be thought of as either a database user, or a group of database users, depending on how the role is set up.

Roles for Each Web User
-----------------------

PostgREST can accommodate either viewpoint. If you treat a role as a single user then :ref:`user_impersonation` does most of what you need. When an authenticated user makes a request PostgREST will switch into the database role for that user, which in addition to restricting queries, is available to SQL through the :code:`current_user` variable.

You can use row-level security to flexibly restrict visibility and access for the current user. Here is an `example <https://www.enterprisedb.com:443/blog/application-users-vs-row-level-security>`_ from Tomas Vondra, a chat table storing messages sent between users. Users can insert rows into it to send messages to other users, and query it to see messages sent to them by other users.

.. code-block:: postgres

  CREATE TABLE chat (
    message_uuid    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_time    TIMESTAMP NOT NULL DEFAULT now(),
    message_from    NAME      NOT NULL DEFAULT current_user,
    message_to      NAME      NOT NULL,
    message_subject VARCHAR(64) NOT NULL,
    message_body    TEXT
  );

  ALTER TABLE chat ENABLE ROW LEVEL SECURITY;

We want to enforce a policy that ensures a user can see only those messages sent by them or intended for them. Also we want to prevent a user from forging the ``message_from`` column with another person's name.

PostgreSQL allows us to set this policy with row-level security:

.. code-block:: postgres

  CREATE POLICY chat_policy ON chat
    USING ((message_to = current_user) OR (message_from = current_user))
    WITH CHECK (message_from = current_user)

Anyone accessing the generated API endpoint for the chat table will see exactly the rows they should, without our needing custom imperative server-side coding.

.. warning::

   Roles are namespaced per-cluster rather than per-database so they may be prone to collision.

Web Users Sharing Role
----------------------

Alternately database roles can represent groups instead of (or in addition to) individual users. You may choose that all signed-in users for a web app share the role ``webuser``. You can distinguish individual users by including extra claims in the JWT such as email.

.. code:: json

  {
    "role": "webuser",
    "email": "john@doe.com"
  }

SQL code can access claims through PostgREST :ref:`tx_settings`. For instance to get the email claim, call this function:

.. code:: sql

  current_setting('request.jwt.claims', true)::json->>'email';

.. note::

  For PostgreSQL < 14

  .. code:: sql

    current_setting('request.jwt.claim.email', true);

This allows JWT generation services to include extra information and your database code to react to it. For instance the RLS example could be modified to use this ``current_setting`` rather than ``current_user``. The second ``'true'`` argument tells ``current_setting`` to return NULL if the setting is missing from the current configuration.

Hybrid User-Group Roles
-----------------------

You can mix the group and individual role policies. For instance we could still have a webuser role and individual users which inherit from it:

.. code-block:: postgres

  CREATE ROLE webuser NOLOGIN;
  -- grant this role access to certain tables etc

  CREATE ROLE user000 NOLOGIN;
  GRANT webuser TO user000;
  -- now user000 can do whatever webuser can

  GRANT user000 TO authenticator;
  -- allow authenticator to switch into user000 role
  -- (the role itself has nologin)

Schemas
=======

You must explicitly allow roles to access the exposed schemas in :ref:`db-schemas`.

.. code-block:: postgres

   GRANT USAGE ON SCHEMA api TO webuser;

Tables
======

To let web users access tables you must grant them privileges for the operations you want them to do.

.. code-block:: postgres

  GRANT
    SELECT
  , INSERT
  , UPDATE(message_body)
  , DELETE
  ON chat TO webuser;

You can also choose on which table columns the operation is valid. In the above example, the web user can only update the ``message_body`` column.

.. _func_privs:

Functions
=========

By default, when a function is created, the privilege to execute it is not restricted by role. The function access is ``PUBLIC`` — executable by all roles (more details at `PostgreSQL Privileges page <https://www.postgresql.org/docs/current/ddl-priv.html>`_). This is not ideal for an API schema. To disable this behavior, you can run the following SQL statement:

.. code-block:: postgres

  ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

This will change the privileges for all functions created in the future in all schemas. Currently there is no way to limit it to a single schema. In our opinion it's a good practice anyway.

.. note::

    It is however possible to limit the effect of this clause only to functions you define. You can put the above statement at the beginning of the API schema definition, and then at the end reverse it with:

    .. code-block:: postgres

        ALTER DEFAULT PRIVILEGES GRANT EXECUTE ON FUNCTIONS TO PUBLIC;

    This will work because the :code:`alter default privileges` statement has effect on function created *after* it is executed. See `PostgreSQL alter default privileges <https://www.postgresql.org/docs/current/sql-alterdefaultprivileges.html>`_ for more details.

After that, you'll need to grant EXECUTE privileges on functions explicitly:

.. code-block:: postgres

   GRANT EXECUTE ON FUNCTION login TO anonymous;
   GRANT EXECUTE ON FUNCTION signup TO anonymous;

You can also grant execute on all functions in a schema to a higher privileged role:

.. code-block:: postgres

    GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA api TO web_user;

Security definer
----------------

A function is executed with the privileges of the user who calls it. This means that the user has to have all permissions to do the operations the function performs.
If the function accesses private database objects, your :ref:`API roles <roles>` won't be able to successfully execute the function.

Another option is to define the function with the :code:`SECURITY DEFINER` option. Then only one permission check will take place, the permission to call the function, and the operations in the function will have the authority of the user who owns the function itself.

.. code-block:: postgres

  -- login as a user which has privileges on the private schemas

  -- create a sample function
  create or replace function login(email text, pass text, out token text) as $$
  begin
    -- access to a private schema called 'auth'
    select auth.user_role(email, pass) into _role;
    -- other operations
    -- ...
  end;
  $$ language plpgsql security definer;

Note the ``SECURITY DEFINER`` keywords at the end of the function. See `PostgreSQL documentation <https://www.postgresql.org/docs/current/sql-createfunction.html#SQL-CREATEFUNCTION-SECURITY>`_ for more details.

Views
=====

Views are invoked with the privileges of the view owner, much like functions with the ``SECURITY DEFINER`` option. When created by a SUPERUSER role, all `row-level security <https://www.postgresql.org/docs/current/ddl-rowsecurity.html>`_ policies will be bypassed.

If you're on PostgreSQL >= 15, this behavior can be changed by specifying the ``security_invoker`` option.

.. code-block:: postgres

  CREATE VIEW sample_view WITH (security_invoker = true) AS
  SELECT * FROM sample_table;

On PostgreSQL < 15, you can create a non-SUPERUSER role and make this role the view's owner.

.. code-block:: postgres

  CREATE ROLE api_views_owner NOSUPERUSER NOBYPASSRLS;
  ALTER VIEW sample_view OWNER TO api_views_owner;

