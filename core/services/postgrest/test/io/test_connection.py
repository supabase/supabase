"Tests related to PostgREST connection and connections pools"

import os
import re
import signal
import time
import pytest

from config import SECRET
from util import (
    Thread,
    jwtauthheader,
    drain_stdout,
)
from postgrest import (
    Admin,
    run,
    run_pgproxy,
    wait_until_exit,
)


def test_fail_with_invalid_password(defaultenv):
    "Connecting with an invalid password should fail without retries."
    uri = f'postgresql://?dbname={defaultenv["PGDATABASE"]}&host={defaultenv["PGHOST"]}&user=some_protected_user&password=invalid_pass'
    env = {**defaultenv, "PGRST_DB_URI": uri}
    with run(env=env, wait_for=None) as postgrest:
        exitCode = wait_until_exit(postgrest)
        assert exitCode == 1


def test_connect_with_dburi(dburi, defaultenv):
    "Connecting with db-uri instead of LIPQ* environment variables should work."
    defaultenv_without_libpq = {
        key: value
        for key, value in defaultenv.items()
        if key not in ["PGDATABASE", "PGHOST", "PGUSER"]
    }
    env = {**defaultenv_without_libpq, "PGRST_DB_URI": dburi.decode()}
    with run(env=env):
        pass


@pytest.mark.parametrize("dburi_type", ["no_params", "no_params_qmark", "with_params"])
def test_get_pgrst_version_with_uri_connection_string(dburi_type, dburi, defaultenv):
    "The fallback_application_name should be added to the db-uri if it has a URI format"
    defaultenv_without_libpq = {
        key: value
        for key, value in defaultenv.items()
        if key not in ["PGDATABASE", "PGHOST", "PGUSER"]
    }

    env = {
        "no_params": {**defaultenv, "PGRST_DB_URI": "postgresql://"},
        "no_params_qmark": {**defaultenv, "PGRST_DB_URI": "postgresql://?"},
        "with_params": {**defaultenv_without_libpq, "PGRST_DB_URI": dburi.decode()},
    }

    with run(env=env[dburi_type]) as postgrest:
        response = postgrest.session.post("/rpc/get_pgrst_version")
        version = '"%s"' % response.headers["Server"].replace(
            "postgrest/", "PostgREST "
        )
        assert response.text == version


def test_get_pgrst_version_with_keyval_connection_string(defaultenv):
    "The fallback_application_name should be added to the db-uri if it has a keyword/value format"
    uri = f'dbname={defaultenv["PGDATABASE"]} host={defaultenv["PGHOST"]} user={defaultenv["PGUSER"]}'
    defaultenv_without_libpq = {
        key: value
        for key, value in defaultenv.items()
        if key not in ["PGDATABASE", "PGHOST", "PGUSER"]
    }
    env = {**defaultenv_without_libpq, "PGRST_DB_URI": uri}

    with run(env=env) as postgrest:
        response = postgrest.session.post("/rpc/get_pgrst_version")
        version = '"%s"' % response.headers["Server"].replace(
            "postgrest/", "PostgREST "
        )
        assert response.text == version


def test_fail_with_invalid_dbname_and_automatic_recovery_disabled(defaultenv):
    "Should fail without retries when automatic recovery is disabled and dbname is invalid"
    dbname = "INVALID"
    uri = f'postgresql://?dbname={dbname}&host={defaultenv["PGHOST"]}&user={defaultenv["PGUSER"]}'
    env = {
        **defaultenv,
        "PGRST_DB_URI": uri,
        "PGRST_DB_POOL_AUTOMATIC_RECOVERY": "false",
    }

    with run(env=env, wait_for=None) as postgrest:
        exitCode = wait_until_exit(postgrest)
        assert exitCode == 1


def test_fail_with_automatic_recovery_disabled_and_terminated_using_query(defaultenv):
    "Should fail without retries when automatic recovery is disabled and pg_terminate_backend(pid) is called"

    env = {
        **defaultenv,
        "PGRST_DB_POOL_AUTOMATIC_RECOVERY": "false",
        "PGAPPNAME": "target",
    }

    app_name = "'{}'".format(env["PGAPPNAME"])

    with run(env=env) as postgrest:
        os.system(
            f'psql -d {env["PGDATABASE"]} -U {env["PGUSER"]} -h {env["PGHOST"]} --set ON_ERROR_STOP=1 -a -c "SELECT terminate_pgrst({app_name})"'
        )

        exitCode = wait_until_exit(postgrest)
        assert exitCode == 1


def test_read_dburi_from_stdin_without_eol(dburi, defaultenv):
    "Reading the dburi from stdin with a single line should work."
    defaultenv_without_libpq = {
        key: value
        for key, value in defaultenv.items()
        if key not in ["PGDATABASE", "PGHOST", "PGUSER"]
    }
    env = {**defaultenv_without_libpq, "PGRST_DB_URI": "@/dev/stdin"}

    with run(env=env, stdin=dburi):
        pass


def test_read_dburi_from_stdin_with_eol(dburi, defaultenv):
    "Reading the dburi from stdin containing a newline should work."
    defaultenv_without_libpq = {
        key: value
        for key, value in defaultenv.items()
        if key not in ["PGDATABASE", "PGHOST", "PGUSER"]
    }
    env = {**defaultenv_without_libpq, "PGRST_DB_URI": "@/dev/stdin"}

    with run(env=env, stdin=dburi + b"\n"):
        pass


def test_flush_pool_no_interrupt(defaultenv):
    "Flushing the pool via SIGUSR1 doesn't interrupt ongoing requests"

    with run(env=defaultenv) as postgrest:

        def sleep():
            response = postgrest.session.get("/rpc/sleep?seconds=0.5")
            assert response.text == ""
            assert response.status_code == 204

        t = Thread(target=sleep)
        t.start()

        # make sure the request has started
        time.sleep(0.1)

        # SIGUSR1 causes the postgres connection pool to be flushed
        postgrest.process.send_signal(signal.SIGUSR1)

        t.join()


def test_no_pool_connection_required_on_bad_http_logic(defaultenv):
    "no pool connection should be consumed for failing on invalid http logic"

    with run(env=defaultenv, no_pool_connection_available=True) as postgrest:
        # not found nested route shouldn't require opening a connection
        response = postgrest.session.head("/path/notfound")
        assert response.status_code == 404

        # an invalid http method on a resource shouldn't require opening a connection
        response = postgrest.session.request("TRACE", "/projects")
        assert response.status_code == 405
        response = postgrest.session.patch("/rpc/hello")
        assert response.status_code == 405


def test_no_pool_connection_required_on_options(defaultenv):
    "no pool connection should be consumed for OPTIONS requests"

    with run(env=defaultenv, no_pool_connection_available=True) as postgrest:
        # OPTIONS on a table shouldn't require opening a connection
        response = postgrest.session.options("/projects")
        assert response.status_code == 200

        # OPTIONS on RPC shouldn't require opening a connection
        response = postgrest.session.options("/rpc/hello")
        assert response.status_code == 200

        # OPTIONS on root shouldn't require opening a connection
        response = postgrest.session.options("/")
        assert response.status_code == 200


def test_no_pool_connection_required_on_bad_jwt_claim(defaultenv):
    "no pool connection should be consumed for failing on invalid jwt"

    env = {**defaultenv, "PGRST_JWT_SECRET": SECRET}

    with run(env=env, no_pool_connection_available=True) as postgrest:
        # A JWT with an invalid signature shouldn't open a connection
        wrong_secret = "This is the most wrong secret of all secrets"
        headers = jwtauthheader({"role": "postgrest_test_author"}, wrong_secret)
        response = postgrest.session.get("/projects", headers=headers)
        assert response.status_code == 401


def test_no_pool_connection_required_on_bad_embedding(defaultenv):
    "no pool connection should be consumed for failing to embed"

    with run(env=defaultenv, no_pool_connection_available=True) as postgrest:
        # OPTIONS on a table shouldn't require opening a connection
        response = postgrest.session.get("/projects?select=*,unexistent(*)")
        assert response.status_code == 400


@pytest.mark.parametrize("level", ["crit", "error", "warn", "info", "debug"])
def test_pool_acquisition_timeout(level, defaultenv, metapostgrest):
    "Verify that PGRST_DB_POOL_ACQUISITION_TIMEOUT times out when the pool is empty"

    env = {
        **defaultenv,
        "PGRST_DB_POOL": "1",
        "PGRST_DB_POOL_ACQUISITION_TIMEOUT": "1",  # 1 second
        "PGRST_LOG_LEVEL": level,
    }

    with run(
        env=env, no_pool_connection_available=True, wait_max_seconds=3
    ) as postgrest:
        response = postgrest.session.get("/projects")
        assert response.status_code == 504
        data = response.json()
        assert data["message"] == "Timed out acquiring connection from connection pool."

        # ensure the message appears on the logs as well
        output = sorted(postgrest.read_stdout(nlines=10))

        if level == "crit":
            assert len(output) == 0
        else:
            assert any(" 504 " in line for line in output)
            assert any(
                "Timed out acquiring connection from connection pool." in line
                for line in output
            )


def test_pool_acquisition_timeout_logs_are_debounced(defaultenv):
    "Pool acquisition timeout diagnostic logs should be debounced over a burst of failures"

    env = {
        **defaultenv,
        "PGRST_DB_POOL": "1",
        "PGRST_DB_POOL_ACQUISITION_TIMEOUT": "1",
        "PGRST_LOG_LEVEL": "error",
    }
    total_requests = 6

    with run(
        env=env, no_pool_connection_available=True, wait_max_seconds=3
    ) as postgrest:

        def request_timeout():
            response = postgrest.session.get("/projects")
            assert response.status_code == 504
            assert (
                response.json()["message"]
                == "Timed out acquiring connection from connection pool."
            )
            return response

        request_timeout()

        threads = [Thread(target=request_timeout) for _ in range(total_requests - 1)]
        for thread in threads:
            thread.start()
        for thread in threads:
            thread.join()

        # Logger debouncing logs the first timeout immediately and, if more
        # timeouts happen during the cooldown, logs one more time afterwards.
        time.sleep(6)
        output = drain_stdout(postgrest)

    access_logs = [line for line in output if ' "GET /projects HTTP/1.1" 504 ' in line]
    timeout_logs = [
        line
        for line in output
        if "Timed out acquiring connection from connection pool." in line
    ]

    assert len(access_logs) == total_requests
    assert len(timeout_logs) == 2


def test_positive_pool_metric(defaultenv):
    "When a network failure is caused on the pg connection, pgrst_db_pool_available stays positive"

    with run_pgproxy(defaultenv, proxy_timeout="1ms") as pgproxyhost:
        env = {**defaultenv, "PGHOST": pgproxyhost}

        with run(env=env, wait_for=Admin.live) as postgrest:
            response = postgrest.admin.get("/metrics", timeout=1)
            assert response.status_code == 200

            metrics = float(
                re.search(
                    r"pgrst_db_pool_available (-?\d+(?:\.\d+)?)", response.text
                ).group(1)
            )
            assert metrics >= 0
