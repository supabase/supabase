CREATE ROLE test_user_role;

CREATE ROLE test_admin_role;

GRANT authenticated TO test_user_role;

GRANT postgres TO test_admin_role;

INSERT INTO auth.users (id, "role", email)
    VALUES (gen_random_uuid (), 'test_user_role', 'bob@supabase.com')
RETURNING
    * \gset bob_

INSERT INTO auth.users (id, "role", email)
    VALUES (gen_random_uuid (), 'test_user_role', 'alice@supabase.com')
RETURNING
    * \gset alice_

INSERT INTO auth.users (id, "role", email)
    VALUES (gen_random_uuid (), 'test_admin_role', 'admin@supabase.com')
RETURNING
    * \gset admin_

CREATE OR REPLACE FUNCTION test_logout ()
    RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM
        set_config('request.jwt.claim.sub', NULL, TRUE);
    PERFORM
        set_config('request.jwt.claim.role', NULL, TRUE);
    PERFORM
        set_config('request.jwt.claim.email', NULL, TRUE);
    RESET ROLE;
END;
$$;

CREATE OR REPLACE FUNCTION test_login (user_email text, logout_first boolean = TRUE)
    RETURNS auth.users
    LANGUAGE plpgsql
    AS $$
DECLARE
    auth_user auth.users;
BEGIN
    IF logout_first THEN
        PERFORM
            test_logout ();
    END IF;
    SELECT
        * INTO auth_user
    FROM
        auth.users
    WHERE
        email = user_email;
    PERFORM
        set_config('request.jwt.claim.sub', (auth_user).id::text, TRUE);
    PERFORM
        set_config('request.jwt.claim.role', (auth_user).ROLE, TRUE);
    PERFORM
        set_config('request.jwt.claim.email', (auth_user).email, TRUE);
    RAISE NOTICE '%', format( 'SET ROLE %I; -- Logging in as %L (%L)', (auth_user).ROLE, (auth_user).id, (auth_user).email);
    EXECUTE format('SET ROLE %I', (auth_user).ROLE);
    RETURN auth_user;
END;
$$;

