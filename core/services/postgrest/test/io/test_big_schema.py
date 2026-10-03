"IO tests for PostgREST started on the big schema."

import re

import pytest
import requests

from postgrest import run


def test_schema_cache_load_max_duration(defaultenv):
    "schema cache load should not surpass a max_duration of elapsed milliseconds"

    max_duration = 500.0

    env = {
        **defaultenv,
        "PGRST_DB_SCHEMAS": "apflora",
        "PGRST_DB_POOL": "2",
        "PGRST_DB_ANON_ROLE": "postgrest_test_anonymous",
    }

    with run(env=env, wait_max_seconds=30, no_startup_stdout=False) as postgrest:
        log_lines = postgrest.read_stdout(nlines=50)
        schema_cache_lines = [
            line for line in log_lines if "Schema cache loaded in" in line
        ]

        match = re.search(
            r"Schema cache loaded in ([0-9]+(?:\.[0-9])?) milliseconds",
            schema_cache_lines[-1],
        )

        assert match, f"unexpected log format: {schema_cache_lines[-1]}"
        duration_ms = float(match.group(1))

        # check that loading takes long enough
        # to make sure we measure the time correctly
        assert 100 < duration_ms < max_duration


# TODO: This test fails now because of https://github.com/PostgREST/postgrest/pull/2122
# The stack size of 1K(-with-rtsopts=-K1K) is not enough and this fails with "stack overflow"
# A stack size of 200K seems to be enough for succeess
@pytest.mark.skip
def test_openapi_in_big_schema(defaultenv):
    "Should get a successful response from openapi on a big schema"

    env = {
        **defaultenv,
        "PGRST_DB_SCHEMAS": "apflora",
        "PGRST_OPENAPI_MODE": "ignore-privileges",
    }

    with run(env=env) as postgrest:
        response = postgrest.session.get("/")
        assert response.status_code == 200


@pytest.mark.parametrize("level", ["crit", "error", "warn", "info", "debug"])
def test_stackoverflow_is_logged(level, defaultenv):
    "Stack overflow should be logged with the Warp message only on log-level=debug"

    env = {
        **defaultenv,
        "PGRST_DB_SCHEMAS": "apflora",
        "PGRST_DB_ANON_ROLE": "postgrest_test_anonymous",
        "PGRST_LOG_LEVEL": level,
    }

    with run(env=env, wait_max_seconds=30, no_startup_stdout=False) as postgrest:
        with pytest.raises(requests.exceptions.ConnectionError):
            postgrest.session.get("/")

        output = postgrest.read_stdout(nlines=10)
        for _ in range(3):
            output.extend(postgrest.read_stdout(nlines=10))

        found = any("Warp server: stack overflow" in line for line in output)

        if level == "debug":
            assert found
        else:
            assert not found


# See: https://github.com/PostgREST/postgrest/issues/3329
def test_should_not_fail_with_stack_overflow(defaultenv):
    "requesting a non-existent relationship should not fail with stack overflow due to fuzzy search of candidates"

    env = {
        **defaultenv,
        "PGRST_DB_SCHEMAS": "apflora",
        "PGRST_DB_POOL": "2",
        "PGRST_DB_ANON_ROLE": "postgrest_test_anonymous",
    }

    with run(env=env, wait_max_seconds=30) as postgrest:
        response = postgrest.session.get("/unknown-table?select=unknown-rel(*)")
        assert response.status_code == 404
        data = response.json()
        assert data["code"] == "PGRST205"


def test_second_request_for_non_existent_table_should_be_quick(defaultenv):
    "requesting a non-existent relationship should be quick after the fuzzy search index is loaded (2nd request)"

    env = {
        **defaultenv,
        "PGRST_DB_SCHEMAS": "fuzzysearch",
        "PGRST_DB_POOL": "2",
        "PGRST_DB_ANON_ROLE": "postgrest_test_anonymous",
    }

    with run(env=env, wait_max_seconds=30) as postgrest:
        response = postgrest.session.get("/unknown-table")
        assert response.status_code == 404
        data = response.json()
        assert data["code"] == "PGRST205"
        first_duration = response.elapsed.total_seconds()
        response = postgrest.session.get("/unknown-table")
        assert response.elapsed.total_seconds() < first_duration / 2
