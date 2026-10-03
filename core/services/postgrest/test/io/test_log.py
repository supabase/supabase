"Test PostgREST logs and observations"

import re
import signal
import time
import pytest
import requests

from config import SECRET
from util import (
    jwtauthheader,
    relativeSeconds,
    drain_stdout,
    match_log,
)
from postgrest import (
    Admin,
    freeport,
    is_ipv6,
    reset_statement_timeout,
    run,
    set_statement_timeout,
    wait_until_exit,
)


@pytest.mark.parametrize("level", ["crit", "error", "warn", "info", "debug"])
def test_log_level(level, defaultenv):
    "log_level should filter request logging"

    env = {**defaultenv, "PGRST_LOG_LEVEL": level}

    # any token to test 500 response for "Server lacks JWT secret"
    claim = {"role": "postgrest_test_author"}
    headers = jwtauthheader(claim, SECRET)

    with run(env=env) as postgrest:
        response = postgrest.session.get("/", headers=headers)
        assert response.status_code == 500

        response = postgrest.session.get("/unknown")
        assert response.status_code == 404

        response = postgrest.session.get("/")
        assert response.status_code == 200

        output = postgrest.read_stdout(nlines=9)

        if level == "crit":
            assert len(output) == 0
        elif level == "error":
            match_log(
                output,
                [r'- - - \[.+\] "GET / HTTP/1.1" 500 \d+ "" "python-requests/.+"'],
            )
            assert len(output) == 1
        elif level == "warn":
            match_log(
                output,
                [
                    r'- - - \[.+\] "GET / HTTP/1.1" 500 \d+ "" "python-requests/.+"',
                    r'- - postgrest_test_anonymous \[.+\] "GET /unknown HTTP/1.1" 404 \d+ "" "python-requests/.+"',
                ],
            )
            assert len(output) == 2
        elif level == "info":
            match_log(
                output,
                [
                    r'- - - \[.+\] "GET / HTTP/1.1" 500 \d+ "" "python-requests/.+"',
                    r'- - postgrest_test_anonymous \[.+\] "GET /unknown HTTP/1.1" 404 \d+ "" "python-requests/.+"',
                    r'- - postgrest_test_anonymous \[.+\] "GET / HTTP/1.1" 200 \d+ "" "python-requests/.+"',
                ],
            )
            assert len(output) == 3
        elif level == "debug":
            match_log(
                output,
                [
                    r'- - - \[.+\] "GET / HTTP/1.1" 500 \d+ "" "python-requests/.+"',
                    r'- - postgrest_test_anonymous \[.+\] "GET /unknown HTTP/1.1" 404 \d+ "" "python-requests/.+"',
                    r'- - postgrest_test_anonymous \[.+\] "GET / HTTP/1.1" 200 \d+ "" "python-requests/.+"',
                ],
            )
            assert len(output) == 9
            assert any("Connection" and "is available" in line for line in output)
            assert any("Connection" and "is used" in line for line in output)


@pytest.mark.parametrize("level", ["crit", "error", "warn", "info", "debug"])
def test_log_query(level, defaultenv):
    "log_query=true should log the SQL query according to the log_level"

    env = {
        **defaultenv,
        "PGRST_LOG_LEVEL": level,
        "PGRST_LOG_QUERY": "true",
    }

    with run(env=env) as postgrest:
        response = postgrest.session.get("/")
        assert response.status_code == 200

        response = postgrest.session.get("/projects")
        assert response.status_code == 200

        response = postgrest.session.get(
            "/projects", headers={"Prefer": "count=estimated"}
        )
        assert response.status_code == 200

        response = postgrest.session.get(
            "/projects", headers={"Prefer": "count=planned"}
        )
        assert response.status_code == 200

        response = postgrest.session.get("/infinite_recursion")
        assert response.status_code == 500

        get_2xx_regx = r'.+: WITH pgrst_source AS.+SELECT "public"\."projects"\.\* FROM "public"\."projects".+_postgrest_t'
        get_2xx_count_regx = (
            r'.+: EXPLAIN \(FORMAT JSON\) SELECT 1  FROM "public"."projects"'
        )
        infinite_recursion_5xx_regx = r'.+: WITH pgrst_source AS.+SELECT "public"\."infinite_recursion"\.\* FROM "public"\."infinite_recursion".+_postgrest_t'
        root_tables_regx = r".+: SELECT   n.nspname AS table_schema, .+ FROM pg_class c .+ ORDER BY table_schema, table_name"
        root_procs_regx = r".+: WITH.+base_types AS.+pn\.nspname AS proc_schema.+FROM pg_proc p.+p\.pronamespace = quote_ident\(\$1\)::regnamespace"
        root_descr_regx = r".+: SELECT pg_catalog\.obj_description\(quote_ident\(\$1\)::regnamespace, 'pg_namespace'\)"
        set_config_regx = (
            r".+: select set_config\('search_path', \$1, true\), set_config\("
        )

        output = drain_stdout(postgrest)

        project_queries = [line for line in output if re.match(get_2xx_regx, line)]
        project_counts = [line for line in output if re.match(get_2xx_count_regx, line)]
        infinite_queries = [
            line for line in output if re.match(infinite_recursion_5xx_regx, line)
        ]
        root_tables = [line for line in output if re.match(root_tables_regx, line)]
        root_procs = [line for line in output if re.match(root_procs_regx, line)]
        root_descr = [line for line in output if re.match(root_descr_regx, line)]
        set_configs = [line for line in output if re.match(set_config_regx, line)]

        if level == "crit":
            assert not set_configs
            assert not project_queries
            assert not project_counts
            assert not infinite_queries
            assert not root_tables
            assert not root_procs
            assert not root_descr
        elif level in {"error", "warn"}:
            assert len(set_configs) == 1
            assert len(infinite_queries) == 1
            assert not project_queries
            assert not project_counts
            assert not root_tables
            assert not root_procs
            assert not root_descr
        elif level == "info":
            assert len(set_configs) == 5
            assert len(project_queries) == 3
            assert len(project_counts) == 2
            assert len(infinite_queries) == 1
            assert len(root_tables) == 1
            assert len(root_procs) == 1
            assert len(root_descr) == 1
        elif level == "debug":
            assert len(set_configs) == 5
            assert len(project_queries) == 3
            assert len(project_counts) == 2
            assert len(infinite_queries) == 1
            assert len(root_tables) == 1
            assert len(root_procs) == 1
            assert len(root_descr) == 1

    pre_req_env = {
        **env,
        "PGRST_DB_PRE_REQUEST": "do_nothing",
    }

    with run(env=pre_req_env) as postgrest:
        response = postgrest.session.get("/projects")
        assert response.status_code == 200

        output = drain_stdout(postgrest)

        pre_request_regx = r'.+: select "do_nothing"()'
        pre_reqs = [line for line in output if re.match(pre_request_regx, line)]

        if level == "crit":
            assert not pre_reqs
        elif level in {"error", "warn"}:
            assert not pre_reqs
        elif level == "info":
            assert len(pre_reqs) == 1
        elif level == "debug":
            assert len(pre_reqs) == 1


@pytest.mark.parametrize("level", ["crit", "error", "warn", "info", "debug"])
@pytest.mark.parametrize("log_query", ["false", "true"])
def test_schema_cache_log_query(level, log_query, defaultenv):
    "Schema cache SQL queries follow log-query and log-level"
    env = {
        **defaultenv,
        "PGRST_LOG_LEVEL": level,
        "PGRST_LOG_QUERY": log_query,
    }

    with run(env=env, no_startup_stdout=False, wait_for=None) as postgrest:
        output = drain_stdout(postgrest)

    # recognizable parts of the schema cache queries
    markers = [
        "columns_agg AS",
        "transform_json as",
        "pks_uniques_cols AS",
        "AS proc_schema",
        "computed_rels as",
        "c.castsource::regtype::text",
        "media_types as",
    ]
    should_log = log_query == "true" and level in {"info", "debug"}
    expected_count = 1 if should_log else 0
    queries = [line for line in output if re.match(r".+: (?:WITH|SELECT) ", line, re.I)]
    for marker in markers:
        actual_count = sum(marker in line for line in queries)
        assert actual_count == expected_count, marker


def test_log_lacks_role_with_empty_anon_role(defaultenv):
    "Requests are logged without a role when db-anon-role is empty."

    env = {
        **defaultenv,
        "PGRST_DB_CONFIG": "false",
        "PGRST_DB_ANON_ROLE": "",
    }

    with run(env=env) as postgrest:
        response = postgrest.session.get("/projects")
        assert response.status_code == 401

        output = postgrest.read_stdout(nlines=1)

    assert len(output) == 1
    assert re.match(
        r'- - - \[.+\] "GET /projects HTTP/1.1" 401 \d+ "" "python-requests/.+"',
        output[0],
    )


def test_log_postgrest_version(defaultenv):
    "Should show the PostgREST version in the logs"
    with run(env=defaultenv, no_startup_stdout=False) as postgrest:
        version = postgrest.session.head("/").headers["Server"].split("/")[1]

        output = postgrest.read_stdout(nlines=1)

        assert "Starting PostgREST %s..." % version in output[0]


@pytest.mark.parametrize(
    "host", ["127.0.0.1", "::1", None], ids=["IPv4", "IPv6", "Unix"]
)
def test_log_postgrest_host_and_port(host, defaultenv):
    "PostgREST should output the host and port it is bound to."

    # We run postgrest on unix socket when host and port are set to None
    is_unix = host is None
    port = None if is_unix else freeport()

    with run(
        env=defaultenv, host=host, port=port, no_startup_stdout=False
    ) as postgrest:
        output = postgrest.read_stdout(nlines=11)

        # Cannot assume a particular log entry order
        # Listening on a socket happens after schema querying
        # but is concurrent to the schema loading process
        # and migh happen before or after writing of the
        # "Schema cache loaded" log entry
        if is_unix:
            match_log(output, [r".*API server listening on .*/tmp/.*\.sock"])
        elif is_ipv6(host):
            match_log(output, [r".*API server listening on \[.+]:\d+"])
        else:  # IPv4
            match_log(output, [r".*API server listening on .+:\d+"])


@pytest.mark.parametrize(
    "host", ["127.0.0.1", "::1", None], ids=["IPv4", "IPv6", "Unix"]
)
def test_log_postgrest_admin_server_host_and_port(host, defaultenv):
    "PostgREST should log the admin server host and port"

    # We run admin server on unix socket when host and admin_port are set to None
    is_unix = host is None
    port = None if is_unix else freeport()
    admin_port = None if is_unix else freeport(used_ports=[port])

    with run(
        env=defaultenv,
        host=host,
        port=port,
        admin_port=admin_port,
        no_startup_stdout=False,
        wait_for=Admin.ready,
    ) as postgrest:
        output = postgrest.read_stdout(nlines=11)

        # Cannot assume a particular log entry order
        # Listening on a socket happens after schema querying
        # but is concurrent to the schema loading process
        # and migh happen before or after writing of the
        # "Schema cache loaded" log entry
        if is_unix:
            match_log(output, [r".*Admin server listening on .*/tmp/.*\.sock"])
        elif is_ipv6(host):
            match_log(output, [r".*Admin server listening on \[.+]:\d+"])
        else:  # IPv4
            match_log(output, [r".*Admin server listening on .+:\d+"])


def test_log_error_when_schema_cache_load_error_on_startup_to_stderr(defaultenv):
    "Should log the 503 error message when there is an error loading schema cache on startup"

    env = {
        **defaultenv,
        "PGRST_INTERNAL_SCHEMA_CACHE_QUERY_SLEEP_BEFORE_QUERIES": "1000",
        "PGRST_DB_SCHEMAS": "non_existent_schema_aaaa",
    }

    with run(env=env, wait_for=None) as postgrest:
        postgrest.wait_until_scache_starts_loading()

        # First call should fail with connection refused
        with pytest.raises(requests.ConnectionError):
            postgrest.session.get("/projects")

        # Next call should return 503
        time.sleep(1)
        response = postgrest.session.get("/projects")
        assert response.status_code == 503

        output_start = postgrest.read_stdout(nlines=10)

        log_err_message = '{"code":"PGRST002","details":null,"hint":null,"message":"Could not query the database for the schema cache. Retrying."}'

        assert any(log_err_message in line for line in output_start)


@pytest.mark.parametrize("level", ["crit", "error", "warn", "info", "debug"])
def test_log_pool_req_observation(level, defaultenv):
    "PostgREST should log PoolRequest and PoolRequestFullfilled observation when log-level=debug"

    env = {**defaultenv, "PGRST_LOG_LEVEL": level, "PGRST_JWT_SECRET": SECRET}

    headers = jwtauthheader({"role": "postgrest_test_author"}, SECRET)

    pool_req = r".*Trying to borrow a connection from pool.*"
    pool_req_fullfill = r".*Borrowed a connection from the pool.*"

    with run(env=env) as postgrest:

        postgrest.session.get("/authors_only", headers=headers)

        if level == "debug":
            output = postgrest.read_stdout(nlines=7)
            assert len(output) == 7
            match_log(output, [pool_req, pool_req_fullfill])
        elif level == "info":
            output = postgrest.read_stdout(nlines=4)
            assert len(output) == 1
        else:
            output = postgrest.read_stdout(nlines=4)
            assert len(output) == 0


def test_log_listener_connection_errors(defaultenv):
    "The logs should show the listener connection error message in a single line"

    env = {
        **defaultenv,
        "PGHOST": "no_host",
        "PGRST_DB_CHANNEL_ENABLED": "true",
    }

    with run(env=env, no_startup_stdout=False, wait_for=None) as postgrest:
        output = postgrest.read_stdout(nlines=5)
        assert any(
            'Failed listening for database notifications on the "pgrst" channel. could not translate host name "no_host" to address:'
            in line
            for line in output
        )


def test_log_listener_connection_start(defaultenv):
    "The logs should show the listener connection start message in a single line"

    env = {
        **defaultenv,
        "PGRST_DB_CHANNEL_ENABLED": "true",
    }

    with run(env=env, no_startup_stdout=False, wait_for=Admin.ready) as postgrest:
        output = postgrest.read_stdout(nlines=10)
        # Check for the listener start message containing host and port
        # Do not check if pg version is displayed properly as it is tricky to test it
        assert any(
            f'"{defaultenv["PGHOST"]}:5432" and listening for database notifications on the "pgrst" channel'
            in line
            for line in output
        )


@pytest.mark.parametrize("level", ["crit", "error", "warn", "info", "debug"])
def test_db_error_logging_to_stderr(level, defaultenv, metapostgrest):
    "verify that DB errors are logged to stderr"

    role = "timeout_authenticator"
    set_statement_timeout(metapostgrest, role, 500)

    env = {
        **defaultenv,
        "PGUSER": role,
        "PGRST_DB_ANON_ROLE": role,
        "PGRST_LOG_LEVEL": level,
    }

    with run(env=env) as postgrest:
        response = postgrest.session.get("/rpc/sleep?seconds=1")
        assert response.status_code == 500

        # ensure the message appears on the logs
        output = postgrest.read_stdout(nlines=8)

        if level == "crit":
            assert len(output) == 0
        elif level == "debug":
            match_log(
                output,
                [
                    r".*canceling statement due to statement timeout.*",
                    r".*500.*",
                ],
            )
        else:
            assert " 500 " in output[1]
            assert "canceling statement due to statement timeout" in output[0]

    reset_statement_timeout(metapostgrest, role)


def test_schema_cache_query_sleep_logs(defaultenv):
    """Schema cache sleep should be reflected in the logged query duration."""

    env = {
        **defaultenv,
        "PGRST_INTERNAL_SCHEMA_CACHE_QUERY_SLEEP": "1000",
    }
    log_pattern = re.compile(r"Schema cache queried in ([\d.]+) milliseconds")

    with run(env=env, wait_max_seconds=3, no_startup_stdout=False) as postgrest:
        observed_ms = None
        collected = []

        lines = postgrest.read_stdout(nlines=10)
        collected.extend(lines)
        for line in lines:
            match = log_pattern.search(line)
            if match:
                observed_ms = float(match.group(1))
                break

        assert observed_ms is not None
        assert 1000 < observed_ms < 2000


@pytest.mark.parametrize("level", ["crit", "error", "warn", "info", "debug"])
def test_schema_cache_query_timings_log(level, defaultenv):
    "Schema cache query timings should be logged on log-level=debug."

    env = {
        **defaultenv,
        "PGRST_LOG_LEVEL": level,
    }
    log_pattern = re.compile(
        r".+: tables: [\d.]+ ms, keydeps: [\d.]+ ms, rels: [\d.]+ ms, funcs: [\d.]+ ms, comprels: [\d.]+ ms, dreps: [\d.]+ ms, mhandlers: [\d.]+ ms"
    )

    with run(env=env, no_startup_stdout=False) as postgrest:
        output = drain_stdout(postgrest)
        timing_matches = [
            match for line in output if (match := log_pattern.match(line))
        ]

        if level == "debug":
            assert len(timing_matches) == 1
        else:
            assert not timing_matches


def test_empty_schema_cache_log_contains_jwt_role(defaultenv):
    "Requests are logged with the role when the schema cache is empty on startup"

    env = {
        **defaultenv,
        "PGRST_DB_SCHEMAS": "non_existent_schema_aaaa",
        "PGRST_JWT_SECRET": SECRET,
    }
    headers = jwtauthheader({"role": "postgrest_test_author"}, SECRET)

    with run(env=env, wait_for=None) as postgrest:
        postgrest.wait_until_scache_starts_loading()

        response = postgrest.session.get("/authors_only", headers=headers)
        assert response.status_code == 503

        output = drain_stdout(postgrest)

    assert any(
        re.match(
            r'- - postgrest_test_author \[.+\] "GET /authors_only HTTP/1.1" 503 \d+ "" "python-requests/.+"',
            line,
        )
        for line in output
    )


def test_expired_jwt_log_lacks_role(defaultenv):
    "Expired JWT requests are logged without a role."

    env = {**defaultenv, "PGRST_JWT_SECRET": SECRET}
    headers = jwtauthheader({"exp": relativeSeconds(-35)}, SECRET)

    with run(env=env) as postgrest:
        response = postgrest.session.get("/authors_only", headers=headers)
        assert response.status_code == 401

        output = postgrest.read_stdout(nlines=1)

    assert len(output) == 1
    assert re.match(
        r'- - - \[.+\] "GET /authors_only HTTP/1.1" 401 \d+ "" "python-requests/.+"',
        output[0],
    )


def test_schema_cache_error_observation(defaultenv):
    "schema cache error observation should be logged with invalid db-schemas or db-extra-search-path"

    env = {
        **defaultenv,
        "PGRST_DB_EXTRA_SEARCH_PATH": "x",
    }

    with run(env=env, no_startup_stdout=False, wait_for=None) as postgrest:
        # TODO: postgrest should exit here, instead it keeps retrying
        # exitCode = wait_until_exit(postgrest)
        # assert exitCode == 1

        output = postgrest.read_stdout(nlines=9)
        assert (
            "Failed to load the schema cache using db-schemas=public and db-extra-search-path=x"
            in output[6]
        )


def test_invalid_rpc_method_log_contains_role(defaultenv):
    "Invalid RPC method requests are logged with the anonymous role."

    with run(env=defaultenv) as postgrest:
        response = postgrest.session.put("/rpc/sleep")
        assert response.status_code == 405

        output = postgrest.read_stdout(nlines=1)

    assert len(output) == 1
    assert re.match(
        r'- - postgrest_test_anonymous \[.+\] "PUT /rpc/sleep HTTP/1.1" 405 \d+ "" "python-requests/.+"',
        output[0],
    )


def test_pgrst_log_503_client_error_to_stderr(defaultenv):
    "PostgREST should log 503 errors to stderr"

    env = {
        **defaultenv,
        "PGAPPNAME": "test-io",
    }

    with run(env=env) as postgrest:

        postgrest.session.get("/rpc/terminate_pgrst?appname=test-io")

        output = postgrest.read_stdout(nlines=6)

        log_message = '{"code":"PGRST001","details":"no connection to the server\\n","hint":null,"message":"Database client error. Retrying the connection."}\n'

        assert any(log_message in line for line in output)


def test_termination_unix_signal_logging(defaultenv):
    "Server logs when handling termination unix signals."

    with run(env=defaultenv) as postgrest:
        postgrest.process.send_signal(signal.SIGTERM)
        lines = postgrest.read_stdout(nlines=1)
        wait_until_exit(postgrest)

    assert any("SIGTERM" in line for line in lines)

    with run(env=defaultenv) as postgrest:
        postgrest.process.send_signal(signal.SIGINT)
        lines = postgrest.read_stdout(nlines=1)
        wait_until_exit(postgrest)

    assert any("SIGINT" in line for line in lines)


def test_options_request_logs_but_cors_preflight_does_not(defaultenv):
    "Plain OPTIONS requests should be logged, but CORS preflight requests should not."

    env = {
        **defaultenv,
        "PGRST_LOG_LEVEL": "info",
        "PGRST_SERVER_CORS_ALLOWED_ORIGINS": "http://example.com",
    }
    preflight_headers = {
        "Origin": "http://example.com",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type",
    }

    with run(env=env) as postgrest:
        response = postgrest.session.options("/projects")
        assert response.status_code == 200

        response = postgrest.session.options("/projects", headers=preflight_headers)
        assert response.status_code == 200
        assert response.headers["Access-Control-Allow-Origin"] == "http://example.com"

        output = drain_stdout(postgrest)

    assert len(output) == 1
    assert re.match(
        r'- - postgrest_test_anonymous \[.+\] "OPTIONS /projects HTTP/1.1" 200 \d+ "" "python-requests/.+"',
        output[0],
    )
