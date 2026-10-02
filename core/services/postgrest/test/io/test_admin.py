"PostgREST admin server related tests"

import os
import re
import signal
import time
import pytest

from config import FIXTURES
from postgrest import (
    freeport,
    reset_statement_timeout,
    run,
    set_statement_timeout,
)


def test_admin_schema_cache(defaultenv):
    "Should get a success response from the admin server containing current schema cache"

    with run(env=defaultenv) as postgrest:
        response = postgrest.admin.get("/schema_cache")
        assert response.status_code == 200
        assert '"dbTables":[[{"qiName":"authors_only"' in response.text


def test_admin_ready_w_channel(defaultenv):
    "Should get a success response from the admin server ready endpoint when the LISTEN channel is enabled"

    env = {
        **defaultenv,
        "PGRST_DB_CHANNEL_ENABLED": "true",
    }

    with run(env=env) as postgrest:
        response = postgrest.admin.get("/ready")
        assert response.status_code == 200


def test_admin_ready_wo_channel(defaultenv):
    "Should get a success response from the admin server ready endpoint when the LISTEN channel is disabled"

    env = {
        **defaultenv,
        "PGRST_DB_CHANNEL_ENABLED": "false",
    }

    with run(env=env) as postgrest:
        response = postgrest.admin.get("/ready")
        assert response.status_code == 200


def test_admin_ready_includes_schema_cache_state(defaultenv, metapostgrest):
    "Should get a failed response from the admin server ready endpoint when the schema cache is not loaded"

    role = "timeout_authenticator"

    env = {
        **defaultenv,
        "PGUSER": role,
        "PGRST_DB_ANON_ROLE": "postgrest_test_anonymous",
        "PGRST_INTERNAL_SCHEMA_CACHE_QUERY_SLEEP": "500",
    }

    with run(env=env) as postgrest:
        # The schema cache query takes at least 500ms, due to PGRST_INTERNAL_SCHEMA_CACHE_QUERY_SLEEP above.
        # Make it impossible to load the schema cache, by setting statement timeout to 400ms.
        set_statement_timeout(metapostgrest, role, 400)

        # force a reconnection so the new role setting is picked up
        postgrest.process.send_signal(signal.SIGUSR1)

        postgrest.wait_until_scache_starts_loading()

        response = postgrest.admin.get("/ready", timeout=1)
        assert response.status_code == 503

        response = postgrest.session.get("/projects", timeout=1)
        assert response.status_code == 200

    reset_statement_timeout(metapostgrest, role)


def test_admin_not_found(defaultenv):
    "Should get a not found from a undefined endpoint on the admin server"

    with run(env=defaultenv) as postgrest:
        response = postgrest.admin.get("/notfound")
        assert response.status_code == 404


def test_admin_ready_dependent_on_main_app(defaultenv):
    "Should get a failure from the admin ready endpoint if the main app also fails"

    with run(env=defaultenv) as postgrest:
        # delete the unix socket to make the main app fail
        os.remove(defaultenv["PGRST_SERVER_UNIX_SOCKET"])
        response = postgrest.admin.get("/ready")
        assert response.status_code == 500


def test_admin_live_good(defaultenv):
    "Should get a success from the admin live endpoint if the main app is running"

    with run(env=defaultenv, port=freeport()) as postgrest:
        response = postgrest.admin.get("/live")
        assert response.status_code == 200


def test_admin_live_dependent_on_main_app(defaultenv):
    "Should get a failure from the admin live endpoint if the main app also fails"

    with run(env=defaultenv) as postgrest:
        # delete the unix socket to make the main app fail
        os.remove(defaultenv["PGRST_SERVER_UNIX_SOCKET"])
        response = postgrest.admin.get("/live")
        assert response.status_code == 500


@pytest.mark.parametrize("specialhostvalue", FIXTURES["specialhostvalues"])
def test_admin_works_with_host_special_values(specialhostvalue, defaultenv):
    "Should get a success from the admin live and ready endpoints when using special host values for the main app"

    with run(env=defaultenv, port=freeport(), host=specialhostvalue) as postgrest:
        response = postgrest.admin.get("/live")
        assert response.status_code == 200

        response = postgrest.admin.get("/ready")
        assert response.status_code == 200


def test_admin_metrics(defaultenv):
    "Should get metrics from the admin endpoint"

    with run(env=defaultenv) as postgrest:
        response = postgrest.admin.get("/metrics")
        assert response.status_code == 200
        assert response.headers["Content-Type"] == "text/plain; charset=utf-8"
        assert "pgrst_schema_cache_query_time_seconds" in response.text
        assert 'pgrst_schema_cache_loads_total{status="SUCCESS"}' in response.text
        assert "pgrst_db_pool_max" in response.text
        assert "pgrst_db_pool_waiting" in response.text
        assert "pgrst_db_pool_available" in response.text
        assert "pgrst_db_pool_timeouts_total" in response.text


def test_admin_metrics_include_ghc_runtime_metrics(defaultenv):
    "Should get GHC runtime metrics from the admin endpoint when RTS stats are enabled"

    with run(env=defaultenv, args=["+RTS", "-T", "-RTS"]) as postgrest:
        response = postgrest.admin.get("/metrics")
        assert response.status_code == 200
        assert "# HELP ghc_gcs_total Total number of GCs" in response.text
        assert "# TYPE ghc_gcs_total counter" in response.text
        assert re.search(r"^ghc_gcs_total \d+(?:\.\d+)?$", response.text, re.MULTILINE)
        assert re.search(
            r"^ghc_allocated_bytes_total \d+(?:\.\d+)?$", response.text, re.MULTILINE
        )


def test_admin_metrics_exclude_ghc_runtime_metrics_by_default(defaultenv):
    "Should not get GHC runtime metrics unless RTS stats are enabled"

    with run(env=defaultenv) as postgrest:
        response = postgrest.admin.get("/metrics")
        assert response.status_code == 200
        assert "ghc_gcs_total" not in response.text
        assert "ghc_allocated_bytes_total" not in response.text


def test_admin_metrics_include_schema_cache_fails(defaultenv, metapostgrest):
    "Should get shema cache fails from the metrics endpoint"

    role = "timeout_authenticator"

    env = {
        **defaultenv,
        "PGUSER": role,
        "PGRST_INTERNAL_SCHEMA_CACHE_QUERY_SLEEP": "50",
    }

    with run(env=env) as postgrest:
        # The schema cache query takes at least 20ms, due to PGRST_INTERNAL_SCHEMA_CACHE_QUERY_SLEEP above.
        # Make it impossible to load the schema cache, by setting statement timeout to 100ms.
        set_statement_timeout(metapostgrest, role, 20)

        # force a reconnection so the new role setting is picked up
        postgrest.process.send_signal(signal.SIGUSR1)

        # wait for some schema cache retries
        time.sleep(1)

        response = postgrest.admin.get("/ready", timeout=1)
        assert response.status_code == 503

        response = postgrest.admin.get("/metrics", timeout=1)
        assert response.status_code == 200

        metrics = float(
            re.search(
                r'pgrst_schema_cache_loads_total{status="FAIL"} (\d+)', response.text
            ).group(1)
        )
        assert metrics == 1.0

    reset_statement_timeout(metapostgrest, role)
