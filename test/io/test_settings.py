"Test app/pg settings in PostgREST"

import signal
import time

from config import CONFIGSDIR, SECRET
from util import (
    Thread,
    jwtauthheader,
    parse_server_timings_header,
)
from postgrest import (
    reset_statement_timeout,
    run,
    set_statement_timeout,
    sleep_until_postgrest_config_reload,
    sleep_until_postgrest_scache_reload,
)


def test_app_settings_reload(tmp_path, defaultenv):
    "App settings should be reloaded from file when PostgREST is sent SIGUSR2."
    config = (CONFIGSDIR / "sigusr2-settings.config").read_text()
    configfile = tmp_path / "test.config"
    configfile.write_text(config)
    uri = "/rpc/get_guc_value?name=app.settings.name_var"

    with run(configfile, env=defaultenv) as postgrest:
        response = postgrest.session.get(uri)
        assert response.text == '"John"'

        # change setting
        configfile.write_text(config.replace("John", "Jane"))
        # reload
        postgrest.process.send_signal(signal.SIGUSR2)

        sleep_until_postgrest_config_reload()

        response = postgrest.session.get(uri)
        assert response.text == '"Jane"'


def test_app_settings_flush_pool(defaultenv):
    """
    App settings should not reset when the db pool is flushed.

    See: https://github.com/PostgREST/postgrest/issues/1141

    """

    env = {**defaultenv, "PGRST_APP_SETTINGS_EXTERNAL_API_SECRET": "0123456789abcdef"}

    with run(env=env) as postgrest:
        uri = "/rpc/get_guc_value?name=app.settings.external_api_secret"
        response = postgrest.session.get(uri)
        assert response.text == '"0123456789abcdef"'

        # SIGUSR1 causes the postgres connection pool to be flushed
        postgrest.process.send_signal(signal.SIGUSR1)
        sleep_until_postgrest_scache_reload()

        uri = "/rpc/get_guc_value?name=app.settings.external_api_secret"
        response = postgrest.session.get(uri)
        assert response.text == '"0123456789abcdef"'


def test_isolation_level(defaultenv):
    "isolation_level should be set per role and per function"

    env = {
        **defaultenv,
        "PGRST_JWT_SECRET": SECRET,
    }

    with run(env=env) as postgrest:
        # default isolation level for postgrest_test_anonymous
        response = postgrest.session.get(
            "/items_w_isolation_level?select=isolation_level&limit=1"
        )
        assert response.text == '[{"isolation_level":"read committed"}]'

        # isolation level for postgrest_test_repeatable_read on GET
        headers = jwtauthheader({"role": "postgrest_test_repeatable_read"}, SECRET)
        response = postgrest.session.get(
            "/items_w_isolation_level?select=isolation_level&limit=1", headers=headers
        )
        assert response.text == '[{"isolation_level":"repeatable read"}]'

        # isolation level for postgrest_test_serializable on POST
        headers = jwtauthheader({"role": "postgrest_test_serializable"}, SECRET)
        headers["Prefer"] = "return=representation"
        response = postgrest.session.post(
            "/items_w_isolation_level?select=isolation_level",
            json={"id": "666"},
            headers=headers,
        )
        assert response.text == '[{"isolation_level":"serializable"}]'

        # isolation level for postgrest_test_serializable on PATCH
        headers = jwtauthheader({"role": "postgrest_test_serializable"}, SECRET)
        headers["Prefer"] = "return=representation"
        response = postgrest.session.patch(
            "/items_w_isolation_level?select=isolation_level&id=eq.666",
            json={"id": "666"},
            headers=headers,
        )
        assert response.text == '[{"isolation_level":"serializable"}]'

        # isolation level for postgrest_test_serializable on DELETE
        headers = jwtauthheader({"role": "postgrest_test_serializable"}, SECRET)
        headers["Prefer"] = "return=representation"
        response = postgrest.session.delete(
            "/items_w_isolation_level?select=isolation_level&id=eq.666", headers=headers
        )
        assert response.text == '[{"isolation_level":"serializable"}]'

        # default isolation level for function
        response = postgrest.session.get("/rpc/default_isolation_level")
        assert response.text == '"read committed"'

        # changes with role isolation level
        headers = jwtauthheader({"role": "postgrest_test_repeatable_read"}, SECRET)
        response = postgrest.session.get(
            "/rpc/default_isolation_level", headers=headers
        )
        assert response.text == '"repeatable read"'

        # isolation level can be set per function
        response = postgrest.session.get("/rpc/serializable_isolation_level")
        assert response.text == '"serializable"'
        response = postgrest.session.get("/rpc/repeatable_read_isolation_level")
        assert response.text == '"repeatable read"'

        # isolation level for a function overrides the role isolation level
        headers = jwtauthheader({"role": "postgrest_test_repeatable_read"}, SECRET)
        response = postgrest.session.get("/rpc/serializable_isolation_level")
        assert response.text == '"serializable"'


def test_statement_timeout(defaultenv, metapostgrest):
    "Statement timeout times out slow statements"

    role = "timeout_authenticator"
    set_statement_timeout(metapostgrest, role, 1000)  # 1 second

    env = {
        **defaultenv,
        "PGUSER": role,
        "PGRST_DB_ANON_ROLE": role,
    }

    with run(env=env) as postgrest:
        response = postgrest.session.get("/rpc/sleep?seconds=0.5")
        assert response.text == ""
        assert response.status_code == 204

        response = postgrest.session.get("/rpc/sleep?seconds=2")
        assert response.status_code == 500
        data = response.json()
        assert data["message"] == "canceling statement due to statement timeout"

    reset_statement_timeout(metapostgrest, role)


def test_change_statement_timeout(defaultenv, metapostgrest):
    "Statement timeout changes take effect immediately"

    role = "timeout_authenticator"

    env = {
        **defaultenv,
        "PGUSER": role,
        "PGRST_DB_ANON_ROLE": role,
    }

    with run(env=env) as postgrest:
        # no limit initially
        response = postgrest.session.get("/rpc/sleep?seconds=1")
        assert response.text == ""
        assert response.status_code == 204

        set_statement_timeout(metapostgrest, role, 500)  # 0.5s

        # trigger schema refresh
        postgrest.process.send_signal(signal.SIGUSR1)
        sleep_until_postgrest_scache_reload()

        response = postgrest.session.get("/rpc/sleep?seconds=1")
        assert response.status_code == 500
        data = response.json()
        assert data["message"] == "canceling statement due to statement timeout"

        set_statement_timeout(metapostgrest, role, 2000)  # 2s

        # trigger role setting refresh
        postgrest.process.send_signal(signal.SIGUSR1)
        sleep_until_postgrest_scache_reload()

        response = postgrest.session.get("/rpc/sleep?seconds=1")
        assert response.text == ""
        assert response.status_code == 204

    reset_statement_timeout(metapostgrest, role)


def test_change_statement_timeout_held_connection(defaultenv, metapostgrest):
    "Statement timeout changes take effect immediately, even with a request outliving the reconfiguration"

    role = "timeout_authenticator"

    env = {
        **defaultenv,
        "PGUSER": role,
        "PGRST_DB_ANON_ROLE": role,
        "PGRST_DB_POOL": "2",
    }

    with run(env=env) as postgrest:
        # start a slow request that holds a pool connection
        def hold_connection():
            response = postgrest.session.get("/rpc/sleep?seconds=1")
            assert response.text == ""
            assert response.status_code == 204

        hold = Thread(target=hold_connection)
        hold.start()
        # give the request time to start before SIGUSR1 flushes the pool
        time.sleep(0.1)

        set_statement_timeout(metapostgrest, role, 500)  # 0.5s
        # trigger schema refresh; flushes pool and establishes a new connection
        postgrest.process.send_signal(signal.SIGUSR1)

        # wait for the slow request's connection to be returned to the pool
        hold.join()

        # subsequent requests should fail due to the lowered timeout; run several in parallel
        # to ensure we use the full pool
        threads = []
        for i in range(2):

            def sleep(i=i):
                response = postgrest.session.get("/rpc/sleep?seconds=1")
                assert response.status_code == 500, "thread {}".format(i)
                data = response.json()
                assert data["message"] == "canceling statement due to statement timeout"

            thread = Thread(target=sleep)
            thread.start()
            threads.append(thread)

        for t in threads:
            t.join()

    reset_statement_timeout(metapostgrest, role)


def test_first_hoisted_setting_is_applied(defaultenv):
    "test that work_mem is applied and statement_timeout is not applied"

    env = {
        **defaultenv,
        "PGRST_DB_HOISTED_TX_SETTINGS": "work_mem",  # only work_mem is hoisted
    }

    with run(env=env) as postgrest:
        response = postgrest.session.get(
            "/rpc/rpc_with_one_hoisted?select=get_work_mem,get_statement_timeout"
        )

        assert response.text == '{"get_work_mem":"3000kB","get_statement_timeout":"5s"}'


def test_second_hoisted_setting_is_applied(defaultenv):
    "test that statement_timeout is applied and work_mem is not applied"

    env = {
        **defaultenv,
        "PGRST_DB_HOISTED_TX_SETTINGS": "statement_timeout",
    }

    with run(env=env) as postgrest:
        response = postgrest.session.get(
            "/rpc/rpc_with_one_hoisted?select=get_work_mem,get_statement_timeout"
        )

        assert response.text == '{"get_work_mem":"4MB","get_statement_timeout":"7s"}'


def test_function_setting_statement_timeout_fails(defaultenv):
    "statement that takes three seconds to execute should fail with one second timeout"

    with run(env=defaultenv) as postgrest:
        response = postgrest.session.post("/rpc/one_sec_timeout")

        assert response.status_code == 500
        assert (
            response.text
            == '{"code":"57014","details":null,"hint":null,"message":"canceling statement due to statement timeout"}'
        )


def test_function_setting_statement_timeout_passes(defaultenv):
    "statement that takes three seconds to execute should succeed with four second timeout"

    with run(env=defaultenv) as postgrest:
        response = postgrest.session.post("/rpc/four_sec_timeout")

        assert response.text == ""
        assert response.status_code == 204


def test_function_setting_work_mem(defaultenv):
    "check function setting work_mem is applied"

    env = {
        **defaultenv,
        "PGRST_DB_HOISTED_TX_SETTINGS": "work_mem",
    }

    with run(env=env) as postgrest:
        response = postgrest.session.get("/rpc/rpc_work_mem?select=get_work_mem")

        assert response.text == '{"get_work_mem":"6000kB"}'


def test_multiple_func_settings(defaultenv):
    "check multiple function settings are applied"

    env = {
        **defaultenv,
        "PGRST_DB_HOISTED_TX_SETTINGS": "work_mem,statement_timeout",
    }

    with run(env=env) as postgrest:
        response = postgrest.session.get(
            "/rpc/rpc_with_two_hoisted?select=get_work_mem,get_statement_timeout"
        )

        assert (
            response.text == '{"get_work_mem":"5000kB","get_statement_timeout":"10s"}'
        )


def test_get_granted_superuser_setting(defaultenv):
    "Should succeed when the impersonated role has granted superuser settings"

    env = {**defaultenv, "PGRST_DB_CONFIG": "true", "PGRST_JWT_SECRET": SECRET}

    with run(stdin=SECRET.encode(), env=env) as postgrest:
        response_ver = postgrest.session.get("/rpc/get_postgres_version")
        pg_ver = eval(response_ver.text)
        if pg_ver >= 150000:
            headers = jwtauthheader(
                {"role": "postgrest_test_w_superuser_settings"}, SECRET
            )
            response = postgrest.session.get(
                "/rpc/get_guc_value?name=log_min_duration_sample", headers=headers
            )
            assert response.text == '"12345ms"'


def test_role_settings(defaultenv):
    "statement_timeout should be set per role"

    env = {
        **defaultenv,
        "PGRST_JWT_SECRET": SECRET,
    }

    with run(env=env) as postgrest:
        # statement_timeout for postgrest_test_anonymous
        response = postgrest.session.get("/rpc/get_guc_value?name=statement_timeout")
        assert response.text == '"5s"'

        # reload statement_timeout with NOTIFY
        response = postgrest.session.post(
            "/rpc/change_role_statement_timeout", data={"timeout": "8s"}
        )
        assert response.text == ""
        assert response.status_code == 204

        response = postgrest.session.get("/rpc/reload_pgrst_config")
        assert response.text == ""
        assert response.status_code == 204
        sleep_until_postgrest_config_reload()

        response = postgrest.session.get("/rpc/get_guc_value?name=statement_timeout")
        assert response.text == '"8s"'

        # statement_timeout for postgrest_test_author
        headers = jwtauthheader({"role": "postgrest_test_author"}, SECRET)
        response = postgrest.session.get(
            "/rpc/get_guc_value?name=statement_timeout", headers=headers
        )
        assert response.text == '"10s"'

        # reset statement timeout to original value
        response = postgrest.session.post(
            "/rpc/change_role_statement_timeout", data={"timeout": "5s"}
        )
        assert response.status_code == 204


def test_succeed_w_role_having_superuser_settings(defaultenv):
    "Should succeed when having superuser settings on the impersonated role"

    env = {**defaultenv, "PGRST_DB_CONFIG": "true", "PGRST_JWT_SECRET": SECRET}

    with run(stdin=SECRET.encode(), env=env) as postgrest:
        headers = jwtauthheader({"role": "postgrest_test_w_superuser_settings"}, SECRET)
        response = postgrest.session.get("/projects", headers=headers)
        print(response.text)
        assert response.status_code == 200


def test_proxy_status_header_with_role_statement_timeout(defaultenv, metapostgrest):
    "Test Proxy-Status header in statement timeout error"

    role = "timeout_authenticator"
    set_statement_timeout(metapostgrest, role, 1000)  # 1 second

    env = {
        **defaultenv,
        "PGUSER": role,
        "PGRST_DB_ANON_ROLE": role,
    }

    with run(env=env) as postgrest:
        response = postgrest.session.get("/rpc/sleep?seconds=2")
        assert response.status_code == 500
        assert response.headers["Proxy-Status"] == "PostgREST; error=57014"
        data = response.json()
        assert data["message"] == "canceling statement due to statement timeout"


def test_server_timing_transaction_duration_with_role_statement_timeout(
    defaultenv, metapostgrest
):
    "server-timing transaction duration should be accurate"

    # just to ensure we don't timeout
    role = "timeout_authenticator"
    set_statement_timeout(metapostgrest, role, 3000)  # 3 seconds

    env = {
        **defaultenv,
        "PGUSER": role,
        "PGRST_DB_ANON_ROLE": role,
        "PGRST_SERVER_TIMING_ENABLED": "true",
    }

    with run(env=env) as postgrest:
        response = postgrest.session.get("/rpc/sleep?seconds=2")

        assert response.status_code == 204

        response_dur = parse_server_timings_header(response.headers["Server-Timing"])[
            "transaction"
        ]

        assert 2000 <= response_dur < 3000


def test_work_mem_in_role_settings(defaultenv):
    "Should work when setting work_mem on a role. See https://github.com/PostgREST/postgrest/issues/4955"

    env = {
        **defaultenv,
        "PGRST_JWT_SECRET": SECRET,
    }

    headers = jwtauthheader({"role": "postgrest_test_work_mem"}, SECRET)

    with run(env=env) as postgrest:
        response = postgrest.session.post("/rpc/get_work_mem", headers=headers)
        assert response.status_code == 200
        assert response.text == '"3MB"'
