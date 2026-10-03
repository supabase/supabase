.. _sql-user-management-using-postgres-users-and-passwords:

SQL User Management using postgres' users and passwords
=======================================================

:author: `fjf2002 <https://github.com/fjf2002>`_


This is an alternative to chapter :ref:`sql_user_management`, solely using the PostgreSQL built-in table `pg_catalog.pg_authid <https://www.postgresql.org/docs/current/catalog-pg-authid.html>`_ for user management. This means

- no dedicated user table (aside from :code:`pg_authid`) is required

- PostgreSQL's users and passwords (i. e. the stuff in :code:`pg_authid`) are also used at the PostgREST level.

.. note::
  Only PostgreSQL users with SCRAM-SHA-256 password hashes (the default since PostgreSQL v14) are supported.

.. warning::

  This is experimental. We can't give you any guarantees, especially concerning security. Use at your own risk.



Working with pg_authid and SCRAM-SHA-256 hashes
-----------------------------------------------

As in :ref:`sql_user_management`, we create a :code:`basic_auth` schema:

.. code-block:: postgres

  -- We put things inside the basic_auth schema to hide
  -- them from public view. Certain public procs/views will
  -- refer to helpers and tables inside.
  CREATE SCHEMA basic_auth;


As in :ref:`sql_user_management`, we create the :code:`pgcrypto` and :code:`pgjwt` extensions. Here we prefer to put the extensions in its own schemas:

.. code-block:: postgres

  CREATE SCHEMA ext_pgcrypto;
  ALTER SCHEMA ext_pgcrypto OWNER TO postgres;
  CREATE EXTENSION pgcrypto WITH SCHEMA ext_pgcrypto;


Concerning the `pgjwt extension <https://github.com/michelp/pgjwt>`_, please cf. to :ref:`jwt-from-sql`.

.. code-block:: postgres

  CREATE SCHEMA ext_pgjwt;
  ALTER SCHEMA ext_pgjwt OWNER TO postgres;
  CREATE EXTENSION pgjwt WITH SCHEMA ext_pgjwt;


In order to be able to work with postgres' SCRAM-SHA-256 password hashes, we also need the PBKDF2 key derivation function. Luckily there is `a PL/pgSQL implementation on stackoverflow <https://stackoverflow.com/a/72805848>`_:

.. code-block:: postgres

  CREATE FUNCTION basic_auth.pbkdf2(salt bytea, pw text, count integer, desired_length integer, algorithm text) RETURNS bytea
      LANGUAGE plpgsql IMMUTABLE
      AS $$
  DECLARE
    hash_length integer;
    block_count integer;
    output bytea;
    the_last bytea;
    xorsum bytea;
    i_as_int32 bytea;
    i integer;
    j integer;
    k integer;
  BEGIN
    algorithm := lower(algorithm);
    CASE algorithm
    WHEN 'md5' then
      hash_length := 16;
    WHEN 'sha1' then
      hash_length = 20;
    WHEN 'sha256' then
      hash_length = 32;
    WHEN 'sha512' then
      hash_length = 64;
    ELSE
      RAISE EXCEPTION 'Unknown algorithm "%"', algorithm;
    END CASE;
    --
    block_count := ceil(desired_length::real / hash_length::real);
    --
    FOR i in 1 .. block_count LOOP
      i_as_int32 := E'\\000\\000\\000'::bytea || chr(i)::bytea;
      i_as_int32 := substring(i_as_int32, length(i_as_int32) - 3);
      --
      the_last := salt::bytea || i_as_int32;
      --
      xorsum := ext_pgcrypto.HMAC(the_last, pw::bytea, algorithm);
      the_last := xorsum;
      --
      FOR j IN 2 .. count LOOP
        the_last := ext_pgcrypto.HMAC(the_last, pw::bytea, algorithm);

        -- xor the two
        FOR k IN 1 .. length(xorsum) LOOP
          xorsum := set_byte(xorsum, k - 1, get_byte(xorsum, k - 1) # get_byte(the_last, k - 1));
        END LOOP;
      END LOOP;
      --
      IF output IS NULL THEN
        output := xorsum;
      ELSE
        output := output || xorsum;
      END IF;
    END LOOP;
    --
    RETURN substring(output FROM 1 FOR desired_length);
  END $$;

  ALTER FUNCTION basic_auth.pbkdf2(salt bytea, pw text, count integer, desired_length integer, algorithm text) OWNER TO postgres;


Analogous to how :ref:`sql_user_management` creates the function :code:`basic_auth.user_role`, we create a helper function to check the user's password, here with another name and signature (since we want the username, not an email address).
But contrary to :ref:`sql_user_management`, this function does not use a dedicated :code:`users` table with passwords, but instead utilizes the built-in table `pg_catalog.pg_authid <https://www.postgresql.org/docs/current/catalog-pg-authid.html>`_:

.. code-block:: postgres

  CREATE FUNCTION basic_auth.check_user_pass(username text, password text) RETURNS name
      LANGUAGE sql
      AS
  $$
    SELECT rolname AS username
    FROM pg_authid
    -- regexp-split scram hash:
    CROSS JOIN LATERAL regexp_match(rolpassword, '^SCRAM-SHA-256\$(.*):(.*)\$(.*):(.*)$') AS rm
    -- identify regexp groups with sane names:
    CROSS JOIN LATERAL (SELECT rm[1]::integer AS iteration_count, decode(rm[2], 'base64') as salt, decode(rm[3], 'base64') AS stored_key, decode(rm[4], 'base64') AS server_key, 32 AS digest_length) AS stored_password_part
    -- calculate pbkdf2-digest:
    CROSS JOIN LATERAL (SELECT basic_auth.pbkdf2(salt, check_user_pass.password, iteration_count, digest_length, 'sha256')) AS digest_key(digest_key)
    -- based on that, calculate hashed passwort part:
    CROSS JOIN LATERAL (SELECT ext_pgcrypto.digest(ext_pgcrypto.hmac('Client Key', digest_key, 'sha256'), 'sha256') AS stored_key, ext_pgcrypto.hmac('Server Key', digest_key, 'sha256') AS server_key) AS check_password_part
    WHERE rolpassword IS NOT NULL
      AND pg_authid.rolname = check_user_pass.username
      -- verify password:
      AND check_password_part.stored_key = stored_password_part.stored_key
      AND check_password_part.server_key = stored_password_part.server_key;
  $$;

  ALTER FUNCTION basic_auth.check_user_pass(username text, password text) OWNER TO postgres;



Public User Interface
---------------------

Analogous to :ref:`sql_user_management`, we create a login function which takes a username and password and returns a JWT if the credentials match a user in the internal table.
Here we use the username instead of the email address to identify a user.


Logins
~~~~~~

As described in :ref:`jwt-from-sql`, we'll create a JWT token inside our login function. Note that you'll need to adjust the secret key which is hard-coded in this example to a secure (at least thirty-two character) secret of your choosing.


.. code-block:: postgres

  -- if you are not using psql, you need to replace :DBNAME with the current database's name.
  ALTER DATABASE :DBNAME SET "app.jwt_secret" to 'reallyreallyreallyreallyverysafe';


  CREATE FUNCTION public.login(username text, password text, OUT token text)
      LANGUAGE plpgsql security definer
      AS $$
  DECLARE
    _role name;
  BEGIN
    -- check email and password
    SELECT basic_auth.check_user_pass(username, password) INTO _role;
    IF _role IS NULL THEN
      RAISE invalid_password USING message = 'invalid user or password';
    END IF;
    --
    SELECT ext_pgjwt.sign(
        row_to_json(r), current_setting('app.jwt_secret')
      ) AS token
      FROM (
        SELECT login.username as role,
          extract(epoch FROM now())::integer + 60*60 AS exp
      ) r
      INTO token;
  END;
  $$;

  ALTER FUNCTION public.login(username text, password text) OWNER TO postgres;



Permissions
~~~~~~~~~~~

Analogous to :ref:`sql_user_management`:
Your database roles need access to the schema, tables, views and functions in order to service HTTP requests.
Recall from the :ref:`roles` that PostgREST uses special roles to process requests, namely the authenticator and
anonymous roles. Below is an example of permissions that allow anonymous users to attempt to log in.


.. code-block:: postgres

  CREATE ROLE anon NOINHERIT;
  CREATE role authenticator NOINHERIT LOGIN PASSWORD 'secret';
  GRANT anon TO authenticator;

  GRANT EXECUTE ON FUNCTION public.login(username text, password text) TO anon;


Since the above :code:`login` function is defined as `security definer <https://www.postgresql.org/docs/current/sql-createfunction.html#id-1.9.3.67.10.2>`_,
the anonymous user :code:`anon` doesn't need permission to access the table :code:`pg_catalog.pg_authid` .
:code:`grant execute on function` is included for clarity but it might not be needed, see :ref:`func_privs` for more details.

Choose a secure password for role :code:`authenticator`.
Do not forget to configure PostgREST to use the :code:`authenticator` user to connect, and to use the :code:`anon` user as anonymous user.


Testing
-------

Let us create a sample user:

.. code-block:: postgres

  CREATE ROLE foo PASSWORD 'bar';


Test at the SQL level
~~~~~~~~~~~~~~~~~~~~~

Execute:

.. code-block:: postgres

  SELECT * FROM public.login('foo', 'bar');


This should return a single scalar field like:

::

                                                              token
  -----------------------------------------------------------------------------------------------------------------------------
  TEST_JWT_REDACTED
  (1 row)


Test at the REST level
~~~~~~~~~~~~~~~~~~~~~~
An API request to call this function would look like:

.. code-block:: bash

  curl "http://localhost:3000/rpc/login" \
    -X POST -H "Content-Type: application/json" \
    -d '{ "username": "foo", "password": "bar" }'

The response would look like the snippet below. Try decoding the token at `jwt.io <https://jwt.io/>`_. (It was encoded with a secret of :code:`reallyreallyreallyreallyverysafe` as specified in the SQL code above. You'll want to change this secret in your app!)

.. code:: json

  {
    "token": "TEST_JWT_REDACTED"
  }



A more sophisticated test at the REST level
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Let's add a table, intended for the :code:`foo` user:


.. code-block:: postgres

  CREATE TABLE public.foobar(foo int, bar text, baz float);
  ALTER TABLE public.foobar owner TO postgres;


Now try to get the table's contents with:

.. code-block:: bash

  curl "http://localhost:3000/foobar"


This should fail --- of course, we haven't specified the user, thus PostgREST falls back to the :code:`anon` user and denies access.
Add an :code:`Authorization` header. Please use the token value from the login function call above instead of the one provided below.

.. code-block:: bash

  curl "http://localhost:3000/foobar" \
    -H "Authorization: Bearer TEST_JWT_REDACTED"


This will fail again --- we get :code:`Permission denied to set role`. We forgot to allow the authenticator role to switch into this user by executing:

.. code-block:: postgres

  GRANT foo TO authenticator;


Re-execute the last REST request. We fail again --- we also forgot to grant permissions for :code:`foo` on the table. Execute:

.. code-block:: postgres

   GRANT SELECT ON TABLE public.foobar TO foo;

Now the REST request should succeed. An empty JSON array :code:`[]` is returned.
