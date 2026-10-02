"Test PostgREST configuration related behavior"

import time
import pytest
from operator import attrgetter

from config import BASEDIR, FIXTURES, SECRET
from util import (
    Thread,
    authheader,
    jwtauthheader,
)
from postgrest import (
    PostgrestTimedOut,
    freeport,
    run,
)


def test_pool_size(defaultenv, metapostgrest):
    "Verify that PGRST_DB_POOL setting allows the correct number of parallel requests"

    env = {
        **defaultenv,
        "PGRST_DB_POOL": "2",
    }

    with run(env=env) as postgrest:
        start = time.time()
        threads = []
        for i in range(4):

            def sleep(i=i):
                response = postgrest.session.get("/rpc/sleep?seconds=0.5")
                assert response.text == ""
                assert response.status_code == 204, "thread {}".format(i)

            t = Thread(target=sleep)
            t.start()
            threads.append(t)
        for t in threads:
            t.join()
        end = time.time()
        delta = end - start

        # sleep 4 times for 0.5s each, with 2 requests in parallel
        # => total time roughly 1s
        assert delta > 1 and delta < 1.5


@pytest.mark.parametrize(
    "secretpath",
    [path for path in (BASEDIR / "secrets").iterdir() if path.suffix != ".jwt"],
    ids=attrgetter("name"),
)
def test_read_secret_from_file(secretpath, defaultenv):
    "Authorization should succeed when the secret is read from a file."

    env = {**defaultenv, "PGRST_JWT_SECRET": f"@{secretpath}"}

    if secretpath.suffix == ".b64":
        env["PGRST_JWT_SECRET_IS_BASE64"] = "true"

    secret = secretpath.read_bytes()
    headers = authheader(secretpath.with_suffix(".jwt").read_text())

    with run(stdin=secret, env=env) as postgrest:
        response = postgrest.session.get("/authors_only", headers=headers)
        print(response.text)
        assert response.status_code == 200


def test_read_secret_from_stdin(defaultenv):
    "Authorization should succeed when the secret is read from stdin."

    env = {**defaultenv, "PGRST_DB_CONFIG": "false", "PGRST_JWT_SECRET": "@/dev/stdin"}

    headers = jwtauthheader({"role": "postgrest_test_author"}, SECRET)

    with run(stdin=SECRET.encode(), env=env) as postgrest:
        response = postgrest.session.get("/authors_only", headers=headers)
        print(response.text)
        assert response.status_code == 200


# TODO: This test would fail right now, because of
# https://github.com/PostgREST/postgrest/issues/2126
@pytest.mark.skip
def test_read_secret_from_stdin_dbconfig(defaultenv):
    "Authorization should succeed when the secret is read from stdin with db-config=true."

    env = {**defaultenv, "PGRST_DB_CONFIG": "true", "PGRST_JWT_SECRET": "@/dev/stdin"}

    headers = jwtauthheader({"role": "postgrest_test_author"}, SECRET)

    with run(stdin=SECRET.encode(), env=env) as postgrest:
        response = postgrest.session.get("/authors_only", headers=headers)
        print(response.text)
        assert response.status_code == 200


@pytest.mark.parametrize(
    "roleclaim", FIXTURES["roleclaims"], ids=lambda claim: claim["key"]
)
def test_role_claim_key(roleclaim, defaultenv):
    "Authorization should depend on a correct role-claim-key and JWT claim."
    env = {
        **defaultenv,
        "PGRST_JWT_ROLE_CLAIM_KEY": roleclaim["key"],
        "PGRST_JWT_SECRET": SECRET,
    }
    headers = jwtauthheader(roleclaim["data"], SECRET)

    with run(env=env) as postgrest:
        response = postgrest.session.get("/authors_only", headers=headers)
        assert response.status_code == roleclaim["expected_status"]


@pytest.mark.parametrize(
    "jwtaudroleclaim",
    FIXTURES["jwtaudroleclaims"],
    ids=lambda claim: claim["key"] + "_" + str(claim["expected_status"]),
)
def test_jwt_aud_in_role_claim_key(jwtaudroleclaim, defaultenv):
    "Allows authorization with JWT aud claim in role-claim-key"

    env = {
        **defaultenv,
        "PGRST_JWT_AUD": "postgrest_test_author",
        "PGRST_JWT_ROLE_CLAIM_KEY": jwtaudroleclaim["key"],
        "PGRST_JWT_SECRET": SECRET,
    }

    headers = jwtauthheader(jwtaudroleclaim["data"], SECRET)

    with run(env=env) as postgrest:
        response = postgrest.session.get("/authors_only", headers=headers)
        assert response.status_code == jwtaudroleclaim["expected_status"]


def test_random_port_bound(defaultenv):
    "PostgREST should bind to a random port when PGRST_SERVER_PORT is 0."

    with run(env=defaultenv, port="0"):
        assert True  # liveness check is done by run(), so we just need to check that it doesn't fail


def test_so_reuseport_defaults_to_false(defaultenv):
    "A second PostgREST instance should not bind to the same port by default."

    host = "0.0.0.0"
    port = freeport()
    admin_port = freeport(used_ports=[port])

    with run(
        env={**defaultenv},
        port=port,
        host=host,
        admin_port=admin_port,
    ):
        with pytest.raises(PostgrestTimedOut):
            with run(
                env={**defaultenv},
                port=port,
                host=host,
                admin_port=freeport(used_ports=[port, admin_port]),
                wait_max_seconds=1,
            ):
                pass


def test_schema_cache_startup_load_with_in_db_config(defaultenv, metapostgrest):
    "verify that the Schema Cache loads correctly at startup, using the in-db `pgrst.db_schemas` config"

    response = metapostgrest.session.post("/rpc/change_db_schemas_config")
    assert response.text == ""
    assert response.status_code == 204

    with run(env=defaultenv) as postgrest:
        response = postgrest.session.get("/rpc/get_current_schema")
        assert response.text == '"test"'
        assert response.status_code == 200

    response = metapostgrest.session.post("/rpc/reset_db_schemas_config")
    assert response.text == ""
    assert response.status_code == 204


def test_allow_configs_to_be_set_to_empty(defaultenv):
    'configs that are explicitly set to empty (= "<empty>") should not throw parse error'

    env = {
        **defaultenv,
        "PGRST_DB_EXTRA_SEARCH_PATH": "",
    }

    with run(env=env) as postgrest:
        response = postgrest.session.get("/projects")
        assert response.status_code == 200


def test_connection_error_message_does_not_claim_retry(defaultenv):
    "The connection error message should not claim retrying, since PostgREST stops on fatal errors."
    uri = f'postgresql://?dbname={defaultenv["PGDATABASE"]}&host={defaultenv["PGHOST"]}&user=some_protected_user&password=invalid_pass'
    env = {**defaultenv, "PGRST_DB_URI": uri}
    with run(env=env, no_startup_stdout=False, wait_for=None) as postgrest:
        output = postgrest.read_stdout(nlines=8)
        assert any('"message":"Database connection error."' in line for line in output)


def test_db_pre_config_with_non_existent_function(defaultenv):
    "Log error when db-pre-config is set to non-existent function"

    env = {
        **defaultenv,
        "PGRST_DB_PRE_CONFIG": "select",  # no "select" function in our fixtures, fail gracefully at startup
    }

    with run(env=env, no_startup_stdout=False, wait_for=None) as postgrest:
        output = postgrest.read_stdout(nlines=8)
        assert any("function select() does not exist" in line for line in output)


@pytest.mark.parametrize("enabled", ["true", "false"])
def test_use_legacy_target_names(enabled, defaultenv):
    "Show a warning when a target name is used instead of an alias, only when config is enabled"

    env = {
        **defaultenv,
        "PGRST_URL_USE_LEGACY_TARGET_NAMES": enabled,
    }

    with run(env=env) as postgrest:
        response = postgrest.session.get(
            "/directors?select=name,all_films:films(title),awards_2026:awards(name)&films.order=title&awards.year=eq.2026"
        )

        output = postgrest.read_stdout(nlines=10)

        log_err_warning = "WARNING: Embedded resource was referenced by relation name even though it has an alias. This is deprecated and will stop working in a future release."
        log_err_hint = "Update filters, orders or limits that use `films` to `all_films`, `awards` to `awards_2026` in `GET /directors?select=name,all_films:films(title),awards_2026:awards(name)&films.order=title&awards.year=eq.2026`"

        has_warning_log = any(log_err_warning in line for line in output)
        has_hint_log = any(log_err_hint in line for line in output)

        if enabled == "true":
            assert response.status_code == 200
            assert has_warning_log and has_hint_log
        else:
            assert response.status_code == 400
            assert not has_warning_log and not has_hint_log
