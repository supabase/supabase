"Test reloading behaviors in PostgREST"

import signal
import time
import pytest
import requests

from config import CONFIGSDIR, SECRET
from util import (
    jwtauthheader,
    psql_as_superuser,
)
from postgrest import (
    run,
    sleep_until_postgrest_config_reload,
    sleep_until_postgrest_full_reload,
    sleep_until_postgrest_scache_reload,
)


def test_db_schema_notify_reload(defaultenv):
    "DB schema and config should be reloaded when PostgREST is sent a NOTIFY"

    env = {**defaultenv, "PGRST_DB_CONFIG": "true", "PGRST_DB_CHANNEL_ENABLED": "true"}

    with run(env=env) as postgrest:
        response = postgrest.session.get("/rpc/get_guc_value?name=search_path")
        assert response.text == '"\\"public\\", \\"public\\""'

        # change db-schemas config on the db and reload config and cache with notify
        postgrest.session.post(
            "/rpc/change_db_schema_and_full_reload", data={"schemas": "v1"}
        )

        sleep_until_postgrest_full_reload()

        response = postgrest.session.get("/rpc/get_guc_value?name=search_path")
        assert response.text == '"\\"v1\\", \\"public\\""'

        # reset db-schemas config on the db
        response = postgrest.session.post("/rpc/reset_db_schema_config")
        assert response.text == ""
        assert response.status_code == 204


def test_db_schema_reload(tmp_path, defaultenv):
    "DB schema should be reloaded from file when PostgREST is sent SIGUSR2."
    config = (CONFIGSDIR / "sigusr2-settings.config").read_text()
    configfile = tmp_path / "test.config"
    configfile.write_text(config)

    with run(configfile, env=defaultenv) as postgrest:
        response = postgrest.session.get("/rpc/get_guc_value?name=search_path")
        assert response.text == '"\\"public\\", \\"public\\""'

        # change setting
        configfile.write_text(
            config.replace('db-schemas = "public"', 'db-schemas = "v1"')
        )

        # reload config
        postgrest.process.send_signal(signal.SIGUSR2)
        sleep_until_postgrest_config_reload()

        # reload schema cache to verify that the config reload actually happened
        postgrest.process.send_signal(signal.SIGUSR1)
        sleep_until_postgrest_scache_reload()

        response = postgrest.session.get("/rpc/get_guc_value?name=search_path")
        assert response.text == '"\\"v1\\", \\"public\\""'


def test_invalid_role_claim_key_notify_reload(defaultenv):
    "NOTIFY reload config should show an error if role-claim-key is invalid"

    env = {
        **defaultenv,
        "PGRST_DB_CONFIG": "true",
        "PGRST_DB_CHANNEL_ENABLED": "true",
        "PGRST_LOG_LEVEL": "crit",
    }

    with run(env=env) as postgrest:
        postgrest.session.post("/rpc/invalid_role_claim_key_reload")

        output = postgrest.read_stdout()
        assert 'Received a config reload message on the "pgrst" channel' in output[0]
        output = postgrest.read_stdout()
        assert "failed to parse role-claim-key value" in output[0]

        response = postgrest.session.post("/rpc/reset_invalid_role_claim_key")
        assert response.text == ""
        assert response.status_code == 204


def test_max_rows_reload(defaultenv):
    "max-rows should be reloaded from role settings when PostgREST receives a SIGUSR2."
    env = {
        **defaultenv,
        "PGRST_DB_CONFIG": "true",
    }

    with run(env=env) as postgrest:
        response = postgrest.session.head("/projects")
        assert response.status_code == 200
        assert response.headers["Content-Range"] == "0-4/*"

        # change max-rows config on the db
        postgrest.session.post("/rpc/change_max_rows_config", data={"val": 1})

        # reload config
        postgrest.process.send_signal(signal.SIGUSR2)

        sleep_until_postgrest_config_reload()

        response = postgrest.session.head("/projects")
        assert response.status_code == 200
        assert response.headers["Content-Range"] == "0-0/*"

        # reset max-rows config on the db
        response = postgrest.session.post("/rpc/reset_max_rows_config")
        assert response.text == ""
        assert response.status_code == 204


def test_max_rows_notify_reload(defaultenv):
    "max-rows should be reloaded from role settings when PostgREST receives a NOTIFY"

    env = {
        **defaultenv,
        "PGRST_DB_CONFIG": "true",
        "PGRST_DB_CHANNEL_ENABLED": "true",
    }

    with run(env=env) as postgrest:
        response = postgrest.session.head("/projects")
        assert response.status_code == 200
        assert response.headers["Content-Range"] == "0-4/*"

        # change max-rows config on the db and reload with notify
        postgrest.session.post(
            "/rpc/change_max_rows_config", data={"val": 1, "notify": True}
        )

        sleep_until_postgrest_config_reload()

        response = postgrest.session.head("/projects")
        assert response.status_code == 200
        assert response.headers["Content-Range"] == "0-0/*"

        # reset max-rows config on the db
        response = postgrest.session.post("/rpc/reset_max_rows_config")
        assert response.text == ""
        assert response.status_code == 204


def test_no_double_schema_cache_reload_on_empty_schema(defaultenv):
    "Should only load the schema cache once when there's an empty schema cache on startup"

    env = {
        **defaultenv,
        "PGRST_INTERNAL_SCHEMA_CACHE_QUERY_SLEEP": "300",
    }

    with run(env=env, wait_for=None) as postgrest:
        postgrest.wait_until_scache_starts_loading()

        with pytest.raises(requests.ConnectionError):
            postgrest.session.get("/projects")

        # Should wait enough time to load the schema cache twice to guarantee that the test is valid
        time.sleep(1)

        response = postgrest.session.get("/projects")
        assert response.status_code == 200

        response = postgrest.admin.get("/metrics")
        assert response.status_code == 200
        assert 'pgrst_schema_cache_loads_total{status="SUCCESS"} 1.0' in response.text


# https://github.com/PostgREST/postgrest/issues/2620
def test_notify_reloading_catalog_cache(defaultenv):
    "notify should reload the connection catalog cache"

    with run(env=defaultenv) as postgrest:
        # first the id col is an uuid
        response = postgrest.session.get(
            "/cats?id=eq.dea27321-f988-4a57-93e4-8eeb38f3cf1e"
        )
        assert response.status_code == 200

        # change it to a bigint
        response = postgrest.session.post("/rpc/drop_change_cats")
        assert response.text == ""
        assert response.status_code == 204
        sleep_until_postgrest_scache_reload()

        # next request should succeed with a bigint value
        response = postgrest.session.get("/cats?id=eq.1")
        assert response.status_code == 200


def test_notify_do_nothing(defaultenv):
    "NOTIFY with unknown message should do nothing"

    env = {
        **defaultenv,
        "PGRST_DB_CONFIG": "true",
        "PGRST_DB_CHANNEL_ENABLED": "true",
        "PGRST_LOG_LEVEL": "crit",
    }

    with run(env=env) as postgrest:
        response = postgrest.session.post("/rpc/notify_do_nothing")
        assert response.text == ""
        assert response.status_code == 204

        output = postgrest.read_stdout()
        assert output == []


def test_schema_cache_concurrent_notifications(slow_schema_cache_env):
    "schema cache should be up-to-date whenever a notification is sent while another reload is in progress, see https://github.com/PostgREST/postgrest/issues/2791"

    internal_sleep = (
        int(slow_schema_cache_env["PGRST_INTERNAL_SCHEMA_CACHE_QUERY_SLEEP"]) / 1000
    )

    with run(env=slow_schema_cache_env, wait_for=None) as postgrest:
        time.sleep(2 * internal_sleep + 0.1)  # wait for readiness manually

        # first request, create a function and set a schema cache reload in progress
        response = postgrest.session.post("/rpc/create_function")
        assert response.text == ""
        assert response.status_code == 204

        time.sleep(
            internal_sleep / 2
        )  # wait to be inside the schema cache reload process

        # second request, change the same function and do another schema cache reload
        response = postgrest.session.post("/rpc/migrate_function")
        assert response.text == ""
        assert response.status_code == 204

        time.sleep(
            2 * internal_sleep
        )  # wait enough time to get the final schema cache state

        # confirm the schema cache is up-to-date and the 2nd reload wasn't lost
        response = postgrest.session.get("/rpc/mult_them?c=3&d=4")
        assert response.text == "12"
        assert response.status_code == 200


def test_jwt_secret_reload(tmp_path, defaultenv):
    "JWT secret should be reloaded from file when PostgREST is sent SIGUSR2."
    config = (CONFIGSDIR / "sigusr2-settings.config").read_text()
    configfile = tmp_path / "test.config"
    configfile.write_text(config)

    headers = jwtauthheader({"role": "postgrest_test_author"}, SECRET)

    with run(configfile, env=defaultenv) as postgrest:
        response = postgrest.session.get("/authors_only", headers=headers)
        assert response.status_code == 401

        # change setting
        configfile.write_text(config.replace("invalid" * 5, SECRET))

        # reload config
        postgrest.process.send_signal(signal.SIGUSR2)

        sleep_until_postgrest_config_reload()

        response = postgrest.session.get("/authors_only", headers=headers)
        assert response.status_code == 200


def test_jwt_secret_external_file_reload(tmp_path, defaultenv):
    "JWT secret external file should be reloaded when PostgREST is sent a SIGUSR2 or a NOTIFY."
    headers = jwtauthheader({"role": "postgrest_test_author"}, SECRET)

    external_secret_file = tmp_path / "jwt-secret-config"
    external_secret_file.write_text("invalid" * 5)

    env = {
        **defaultenv,
        "PGRST_JWT_SECRET": f"@{external_secret_file}",
        "PGRST_DB_CHANNEL_ENABLED": "true",
        "PGRST_DB_CONFIG": "false",
        "PGRST_DB_ANON_ROLE": "postgrest_test_anonymous",  # required for NOTIFY
    }

    with run(env=env) as postgrest:
        response = postgrest.session.get("/authors_only", headers=headers)
        assert response.status_code == 401

        # change external file
        external_secret_file.write_text(SECRET)

        # SIGUSR1 doesn't reload external files, at least when db-config=false
        postgrest.process.send_signal(signal.SIGUSR1)
        sleep_until_postgrest_scache_reload()

        response = postgrest.session.get("/authors_only", headers=headers)
        assert response.status_code == 401

        # reload config and external file with SIGUSR2
        postgrest.process.send_signal(signal.SIGUSR2)
        sleep_until_postgrest_config_reload()

        response = postgrest.session.get("/authors_only", headers=headers)
        assert response.status_code == 200

        # change external file to wrong value again
        external_secret_file.write_text("invalid" * 5)

        # reload config and external file with NOTIFY
        response = postgrest.session.post("/rpc/reload_pgrst_config")
        assert response.text == ""
        assert response.status_code == 204
        sleep_until_postgrest_config_reload()

        response = postgrest.session.get("/authors_only", headers=headers)
        assert response.status_code == 401


def test_invalidate_jwt_cache_when_secret_changes(tmp_path, defaultenv):
    "JWT cache should be emptied after jwt-secret is changed in a config reload"

    headers = jwtauthheader({"role": "postgrest_test_author"}, SECRET)

    external_secret_file = tmp_path / "jwt-secret-config"
    external_secret_file.write_text(SECRET)

    env = {
        **defaultenv,
        "PGRST_JWT_SECRET": f"@{external_secret_file}",
        "PGRST_DB_CHANNEL_ENABLED": "true",
        "PGRST_JWT_CACHE_MAX_ENTRIES": "86400",  # enable cache
        "PGRST_DB_ANON_ROLE": "postgrest_test_anonymous",  # required for NOTIFY
    }

    with run(env=env) as postgrest:
        response = postgrest.session.get("/authors_only", headers=headers)
        assert response.status_code == 200  # jwt gets cached

        # change external file
        external_secret_file.write_text("invalid" * 5)

        # reload config and external file with NOTIFY
        # jwt-cache should get empty
        response = postgrest.session.post("/rpc/reload_pgrst_config")
        assert response.text == ""
        assert response.status_code == 204
        sleep_until_postgrest_config_reload()

        # now the request should fail because the cached token is removed
        response = postgrest.session.get("/authors_only", headers=headers)
        assert response.status_code == 401


def test_stale_schema_cache_dropped_table_returns_database_error(defaultenv):
    "dropped table should return a database error while schema cache is stale"

    internal_sleep = 2
    env = {
        **defaultenv,
        "PGRST_DB_POOL": "2",
        "PGRST_DB_CHANNEL_ENABLED": "true",
        "PGRST_INTERNAL_SCHEMA_CACHE_QUERY_SLEEP": str(internal_sleep * 1000),
    }

    try:
        psql_as_superuser("""
            drop table if exists stale_schema_cache_items;
            create table stale_schema_cache_items(id int primary key);
            insert into stale_schema_cache_items values (1);
            grant select on stale_schema_cache_items to postgrest_test_anonymous;
            """)

        with run(env=env, wait_max_seconds=10) as postgrest:
            response = postgrest.session.get("/stale_schema_cache_items")
            assert response.status_code == 200

            psql_as_superuser("""
                drop table stale_schema_cache_items;
                notify pgrst, 'reload schema';
                """)

            response = postgrest.session.get("/stale_schema_cache_items")
            payload = response.json()
            assert response.status_code == 404
            assert payload["code"] == "42P01"
            assert (
                payload["message"]
                == 'relation "public.stale_schema_cache_items" does not exist'
            )

            time.sleep(internal_sleep + 0.3)

            response = postgrest.session.get("/stale_schema_cache_items")
            payload = response.json()
            assert response.status_code == 404
            assert payload["code"] == "PGRST205"
            assert (
                payload["message"]
                == "Could not find the table 'public.stale_schema_cache_items' in the schema cache"
            )
    finally:
        psql_as_superuser("drop table if exists stale_schema_cache_items;")


def test_config_log_level_is_reloadable(tmp_path, defaultenv):
    "Config log-level should be reloadable on SIGUSR2"

    config = (CONFIGSDIR / "sigusr2-settings.config").read_text()
    configfile = tmp_path / "test.config"
    configfile.write_text(config)

    # Delete the env variable for "log-level" so the config file value isn't overridden
    del defaultenv["PGRST_LOG_LEVEL"]

    with run(configfile, env=defaultenv) as postgrest:
        response = postgrest.session.get("/projects")
        assert response.status_code == 200
        output = postgrest.read_stdout(nlines=5)

        # log-level = error, so this log line shouldn't be logged
        assert not any(
            "Trying to borrow a connection from pool" in line for line in output
        )

        # change setting
        configfile.write_text(
            config.replace('log-level = "error"', 'log-level = "debug"')
        )
        # reload
        postgrest.process.send_signal(signal.SIGUSR2)

        sleep_until_postgrest_config_reload()

        response = postgrest.session.get("/projects")
        assert response.status_code == 200
        output = postgrest.read_stdout(nlines=5)

        # log-level = debug now, so this log line must be logged
        assert any("Trying to borrow a connection from pool" in line for line in output)


def test_config_db_channel_enabled_is_reloadable(tmp_path, defaultenv):
    "Config db-channel-enabled should be reloadable on SIGUSR2"

    config = (CONFIGSDIR / "sigusr2-settings.config").read_text()
    configfile = tmp_path / "test.config"
    configfile.write_text(config)

    with run(configfile, env=defaultenv, no_startup_stdout=False) as postgrest:
        output = postgrest.read_stdout(nlines=7)

        # db-channel-enabled = false, so this shouldn't be logged
        assert not any(
            f'"{defaultenv["PGHOST"]}:5432" and listening for database notifications on the "pgrst" channel'
            in line
            for line in output
        )

        # change setting
        configfile.write_text(
            config.replace(
                'db-channel-enabled = "false"', 'db-channel-enabled = "true"'
            )
        )

        # reload
        postgrest.process.send_signal(signal.SIGUSR2)
        sleep_until_postgrest_config_reload()

        output = postgrest.read_stdout(nlines=7)

        # db-channel-enabled = true, so this logged
        assert any(
            f'"{defaultenv["PGHOST"]}:5432" and listening for database notifications on the "pgrst" channel'
            in line
            for line in output
        )

        # change setting back to false
        configfile.write_text(
            configfile.read_text().replace(
                'db-channel-enabled = "true"', 'db-channel-enabled = "false"'
            )
        )

        # reload
        postgrest.process.send_signal(signal.SIGUSR2)
        sleep_until_postgrest_config_reload()

        output = postgrest.read_stdout(nlines=7)

        # db-channel-enabled = false, so this shouldn't be logged
        assert not any(
            f'"{defaultenv["PGHOST"]}:5432" and listening for database notifications on the "pgrst" channel'
            in line
            for line in output
        )
