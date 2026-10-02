When a client connection is established Supavisor needs to verify the
credentials of the connection.

Credential verification is done either via `user` records or an `auth_query`.

## Tenant User Record

If no `auth_query` exists on the `tenant` record credentials will be looked up
from a `user` and verified against the client connection string credentials.

There must be one or more `user` records for a `tenant` where `is_manager` is `false`.

## Authentication Query

If the `user` in the client connection is not found for a `tenant` it will use
the `user` where `is_manager` is `true` and the `auth_query` on the `tenant` to
return matching credentials from the tenant database.

A simple `auth_query` can be:

```sql
SELECT rolname, rolpassword FROM pg_authid WHERE rolname=$1
```

Alternatively, create a function to return a username and password for a user:

```sql
CREATE USER supavisor;

REVOKE ALL PRIVILEGES ON SCHEMA public FROM supavisor;

CREATE SCHEMA supavisor AUTHORIZATION supavisor;

CREATE OR REPLACE FUNCTION supavisor.get_auth(p_usename TEXT)
RETURNS TABLE(username TEXT, password TEXT) AS
$$
BEGIN
    RAISE WARNING 'Supavisor auth request: %', p_usename;

    RETURN QUERY
    SELECT usename::TEXT, passwd::TEXT FROM pg_catalog.pg_shadow
    WHERE usename = p_usename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION supavisor.get_auth(p_usename TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION supavisor.get_auth(p_usename TEXT) TO supavisor;
```

Update the `auth_query` on the `tenant` and it will use this query to match
against client connection credentials.

```sql
SELECT * FROM supavisor.get_auth($1)
```
