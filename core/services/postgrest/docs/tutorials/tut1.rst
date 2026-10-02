.. _tut1:

Tutorial 1 - The Golden Key
===========================

:author: `begriffs <https://github.com/begriffs>`_

In :ref:`tut0` we created a read-only API with a single endpoint to list todos. There are many directions we can go to make this API more interesting, but one good place to start would be allowing some users to change data in addition to reading it.

Step 1. Add a Trusted User
--------------------------

The previous tutorial created a :code:`web_anon` role in the database with which to execute anonymous web requests. Let's make a role called :code:`todo_user` for users who authenticate with the API. This role will have the authority to do anything to the todo list.

.. code-block:: postgres

  -- run this in psql using the database created
  -- in the previous tutorial

  create role todo_user nologin;
  grant todo_user to authenticator;

  grant usage on schema api to todo_user;
  grant all on api.todos to todo_user;

Step 2. Make a Secret
---------------------

Clients authenticate with the API using JSON Web Tokens. These are JSON objects which are cryptographically signed using a secret only known to the server. Because clients do not know this secret, they cannot tamper with the contents of their tokens. PostgREST will detect counterfeit tokens and will reject them.

Let's create a secret and provide it to PostgREST. Think of a nice long one, or use a tool to generate it. **Your secret must be at least 32 characters long.**

.. note::

  Unix tools can generate a nice secret for you:

  .. code-block:: bash

    # Allow "tr" to process non-utf8 byte sequences
    export LC_CTYPE=C

    # Read random bytes keeping only alphanumerics and add the secret to the configuration file
    echo "jwt-secret = \"$(< /dev/urandom tr -dc A-Za-z0-9 | head -c32)\"" >> tutorial.conf


Check that the :code:`tutorial.conf` (created in the previous tutorial) has the secret set in :code:`jwt-secret`:

.. code-block:: bash

  # THE SECRET MUST BE AT LEAST 32 CHARS LONG
  cat tutorial.conf

If the PostgREST server is still running from the previous tutorial, restart it to load the updated configuration file.

.. _tut1_step3:

Step 3. Sign a Token
--------------------

Ordinarily your own code in the database or in another server will create and sign authentication tokens, but for this tutorial we will make one "by hand" using ``bash`` and ``openssl``.

.. code:: bash

  #!/bin/bash
  set -e

  JWT_SECRET='test_secret_that_is_at_least_32_characters_long'

  _base64 () { openssl base64 -e -A | tr '+/' '-_' | tr -d '='; }

  header=$(echo -n '{"alg":"HS256","typ":"JWT"}' | _base64)

  payload=$(echo -n "{\"role\":\"todo_user\"}" | _base64)

  signature=$(echo -n "$header.$payload" | openssl dgst -sha256 -hmac "$JWT_SECRET" -binary | _base64)

  echo -n "$header.$payload.$signature"

**Remember to fill in the secret you generated rather than keeping the "test_secret_that_is_at_least_32_characters_long".** After you have filled in the secret and payload, the encoded data on the left will update. Copy the encoded token.

.. note::

  While the token may look well obscured, it's easy to reverse engineer the payload. The token is merely signed, not encrypted, so don't put things inside that you don't want a determined client to see. While it is possible to read the payload of the token, it is not possible to read the secret with which it was signed.

Step 4. Make a Request
----------------------

Back in the terminal, let's use :code:`curl` to add a todo. The request will include an HTTP header containing the authentication token.

.. code-block:: bash

  export TOKEN="<paste token here>"

  curl http://localhost:3000/todos -X POST \
       -H "Authorization: Bearer $TOKEN"   \
       -H "Content-Type: application/json" \
       -d '{"task": "learn how to auth"}'

And now we have completed all three items in our todo list, so let's set :code:`done` to true for them all with a :code:`PATCH` request.

.. code-block:: bash

  curl http://localhost:3000/todos -X PATCH \
       -H "Authorization: Bearer $TOKEN"    \
       -H "Content-Type: application/json"  \
       -d '{"done": true}'

A request for the todos shows three of them, and all completed.

.. code-block:: bash

  curl http://localhost:3000/todos

.. code-block:: json

  [
    {
      "id": 1,
      "done": true,
      "task": "finish tutorial 0",
      "due": null
    },
    {
      "id": 2,
      "done": true,
      "task": "pat self on back",
      "due": null
    },
    {
      "id": 3,
      "done": true,
      "task": "learn how to auth",
      "due": null
    }
  ]

Step 5. Add Expiration
----------------------

Currently our authentication token is valid for all eternity. The server, as long as it continues using the same JWT secret, will honor the token.

It's better policy to include an expiration timestamp for tokens using the :code:`exp` claim. This is one of two JWT claims that PostgREST treats specially.

+--------------+----------------------------------------------------------------+
| Claim        | Interpretation                                                 |
+==============+================================================================+
| :code:`role` | The database role under which to execute SQL for API request   |
+--------------+----------------------------------------------------------------+
| :code:`exp`  | Expiration timestamp for token, expressed in "Unix epoch time" |
+--------------+----------------------------------------------------------------+

.. note::

  Epoch time is defined as the number of seconds that have elapsed since 00:00:00 Coordinated Universal Time (UTC), January 1st 1970, minus the number of leap seconds that have taken place since then.

To observe expiration in action, we'll add an :code:`exp` claim of five minutes in the future to our previous token. First find the epoch value of five minutes from now. In :code:`psql` run this:

.. code-block:: postgres

  select extract(epoch from now() + '5 minutes'::interval) :: integer;

Or in ``bash``:


.. code-block:: bash

  exp=$(( EPOCHSECONDS + 5*60 ))  # five minutes

  echo $exp

Go back to :ref:`tut1_step3` and change the payload to

.. code-block:: bash

  payload=$(echo -n "{\"role\":\"todo_user\",\"exp\":123456789}" | _base64)

  echo -n "$header.$payload.$signature"

**NOTE**: Don't forget to change the dummy epoch value :code:`123456789` in the snippet above to the epoch value returned by the :code:`psql` command.

Copy the updated token as before, and save it as a new environment variable.

.. code-block:: bash

  export NEW_TOKEN="<paste new token>"

Try issuing this request in curl before and after the expiration time:

.. code-block:: bash

  curl http://localhost:3000/todos \
       -H "Authorization: Bearer $NEW_TOKEN"

After expiration, the API returns HTTP 401 Unauthorized:

.. code-block:: json

  {
    "code": "PGRST301",
    "details": null,
    "hint": null,
    "message": "JWT expired"
  }

Bonus Topic: Immediate Revocation
---------------------------------

Even with token expiration there are times when you may want to immediately revoke access for a specific token. For instance, suppose you learn that a disgruntled employee is up to no good and his token is still valid.

To revoke a specific token we need a way to tell it apart from others. Let's add a custom :code:`email` claim that matches the email of the client issued the token.

Go ahead and make a new token with the payload

.. code-block:: json

  {
    "role": "todo_user",
    "email": "disgruntled@mycompany.com"
  }

Save it to an environment variable:

.. code-block:: bash

  export WAYWARD_TOKEN="<paste new token>"

PostgREST allows us to specify a function to run during attempted authentication. The function can do whatever it likes, including raising an exception to terminate the request.

First make a new schema and add the function:

.. code-block:: postgres

  create schema auth;
  grant usage on schema auth to web_anon, todo_user;

  create or replace function auth.check_token() returns void
    language plpgsql
    as $$
  begin
    if current_setting('request.jwt.claims', true)::json->>'email' =
       'disgruntled@mycompany.com' then
      raise insufficient_privilege
        using hint = 'Nope, we are on to you';
    end if;
  end
  $$;

Next update :code:`tutorial.conf` and specify the new function:

.. code-block:: ini

  # add this line to tutorial.conf

  db-pre-request = "auth.check_token"

Restart PostgREST for the change to take effect. Next try making a request with our original token and then with the revoked one.

.. code-block:: bash

  # this request still works

  curl http://localhost:3000/todos -X PATCH \
       -H "Authorization: Bearer $TOKEN"    \
       -H "Content-Type: application/json"  \
       -d '{"done": true}'

  # this one is rejected

  curl http://localhost:3000/todos -X PATCH      \
       -H "Authorization: Bearer $WAYWARD_TOKEN" \
       -H "Content-Type: application/json"       \
       -d '{"task": "AAAHHHH!", "done": false}'

The server responds with 403 Forbidden:

.. code-block:: json

  {
    "code": "42501",
    "details": null,
    "hint": "Nope, we are on to you",
    "message": "insufficient_privilege"
  }
