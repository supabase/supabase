"Unit tests for Input/Ouput of PostgREST seen as a black box."

from operator import attrgetter
import signal
import subprocess
import pytest
import yaml

from config import (
    CONFIGSDIR,
    FIXTURES,
    POSTGREST_BIN,
    get_admin_host_and_port_from_config,
    hpctixfile,
)
from postgrest import freeport, is_ipv6, run, set_statement_timeout


class ExtraNewLinesDumper(yaml.SafeDumper):
    "Dumper that inserts an extra newline after each top-level item."

    def write_line_break(self, data=None):
        super().write_line_break(data)
        if len(self.indents) == 1:
            super().write_line_break()


def itemgetter(*items):
    "operator.itemgetter with None as fallback when key does not exist"
    if len(items) == 1:
        item = items[0]

        def g(obj):
            return obj.get(item)

    else:

        def g(obj):
            return tuple(obj.get(item) for item in items)

    return g


class PostgrestError(Exception):
    "Postgrest exited unexpectedly."


def cli(args, env=None, stdin=None, expect_error=False):
    "Run PostgREST and return stdout or stderr."
    env = env or {}

    command = [POSTGREST_BIN] + args
    env["HPCTIXFILE"] = hpctixfile()

    process = subprocess.Popen(
        command,
        env=env,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )

    process.stdin.write(stdin or b"")
    try:
        stdout_output, stderr_output = process.communicate(timeout=5)
        if expect_error:  # When expected to fail, return stderr, else stdout
            if process.returncode == 0:
                raise PostgrestError(
                    "PostgREST unexpectedly exited with return code zero."
                )
            return stderr_output.decode()
        else:
            if process.returncode != 0:
                raise PostgrestError(
                    "PostgREST unexpectedly exited with non-zero return code."
                )
            return stdout_output.decode()
    finally:
        process.kill()
        process.wait()


def dumpconfig(configpath=None, env=None, stdin=None):
    "Dump the config as parsed by PostgREST."
    args = ["--dump-config"]

    if configpath:
        args.append(configpath)

    return cli(args, env=env, stdin=stdin)


@pytest.mark.parametrize(
    "args,env,use_defaultenv,expect",
    map(itemgetter("args", "env", "use_defaultenv", "expect"), FIXTURES["cli"]),
    ids=map(itemgetter("name"), FIXTURES["cli"]),
)
def test_cli(args, env, use_defaultenv, expect, defaultenv):
    """
    When PostgREST is run with <args> arguments and <env>/<defaultenv> environment variabales
    it should return. Exit code should be according to <expect_error>.
    """
    # use --dump-config by default to make sure that the postgrest process will terminate for sure
    args = args or ["--dump-config"]

    env = env or {}
    if use_defaultenv:
        env = {**defaultenv, **env}

    if expect == "error":
        with pytest.raises(PostgrestError):
            print(cli(args, env=env))
    else:
        dump = cli(args, env=env).split("\n")
        if expect:
            assert expect in dump


def test_server_port_and_admin_port_same_value(defaultenv):
    "PostgREST should exit with an error message in output if server-port and admin-server-port are the same."
    env = {**defaultenv, "PGRST_SERVER_PORT": "3000", "PGRST_ADMIN_SERVER_PORT": "3000"}

    error = cli(["--dump-config"], env=env, expect_error=True)
    assert "admin-server-port cannot be the same as server-port" in error


@pytest.mark.parametrize(
    "expectedconfig",
    [
        expectedconfig
        for expectedconfig in (CONFIGSDIR / "expected").iterdir()
        if (CONFIGSDIR / expectedconfig.name).exists()
    ],
    ids=attrgetter("name"),
)
def test_expected_config(expectedconfig):
    """
    Configs as dumped by PostgREST should match an expected output.

    Used to test default values, config aliases and environment variables. The
    expected output for each file in 'configs', if available, is found in the
    'configs/expected' directory.

    """
    expected = expectedconfig.read_text()
    config = CONFIGSDIR / expectedconfig.name

    assert dumpconfig(config) == expected


def test_expected_config_from_environment():
    "Config should be read directly from environment without config file."

    envfile = (CONFIGSDIR / "no-defaults-env.yaml").read_text()
    env = {k: str(v) for k, v in yaml.load(envfile, Loader=yaml.Loader).items()}

    expected = (CONFIGSDIR / "expected" / "no-defaults.config").read_text()
    assert dumpconfig(env=env) == expected


@pytest.mark.parametrize(
    "role, expectedconfig",
    [
        ("db_config_authenticator", "no-defaults-with-db.config"),
        ("other_authenticator", "no-defaults-with-db-other-authenticator.config"),
    ],
)
def test_expected_config_from_db_settings(baseenv, role, expectedconfig):
    "Config should be overriden from database settings"

    config = CONFIGSDIR / "no-defaults.config"

    env = {
        **baseenv,
        "PGUSER": role,
        "PGRST_DB_URI": "postgresql://",
        "PGRST_DB_CONFIG": "true",
    }

    expected = (CONFIGSDIR / "expected" / expectedconfig).read_text()
    assert dumpconfig(configpath=config, env=env) == expected


@pytest.mark.parametrize(
    "config",
    [conf for conf in CONFIGSDIR.iterdir() if conf.suffix == ".config"],
    ids=attrgetter("name"),
)
def test_stable_config(tmp_path, config, defaultenv):
    """
    A dumped, re-read and re-dumped config should match the dumped config.

    Note: only dump vs. re-dump must be equal, as the original config file might
    be different because of default values, whitespace, and quoting.

    """

    dumped = dumpconfig(config, env=defaultenv)

    tmpconfigpath = tmp_path / "config"
    tmpconfigpath.write_text(dumped)
    redumped = dumpconfig(tmpconfigpath, env=defaultenv)

    assert dumped == redumped


@pytest.mark.parametrize("invalidroleclaimkey", FIXTURES["invalidroleclaimkeys"])
def test_invalid_role_claim_key(invalidroleclaimkey, defaultenv):
    "Given an invalid role-claim-key, Postgrest should exit with a non-zero exit code."
    env = {
        **defaultenv,
        "PGRST_JWT_ROLE_CLAIM_KEY": invalidroleclaimkey,
    }

    error = cli(["--dump-config"], env=env, expect_error=True)
    assert f"failed to parse role-claim-key value ({invalidroleclaimkey})" in error


@pytest.mark.parametrize("invalidopenapimodes", FIXTURES["invalidopenapimodes"])
def test_invalid_openapi_mode(invalidopenapimodes, defaultenv):
    "Given an invalid openapi-mode, Postgrest should exit with a non-zero exit code."
    env = {
        **defaultenv,
        "PGRST_OPENAPI_MODE": invalidopenapimodes,
    }

    error = cli(["--dump-config"], env=env, expect_error=True)
    assert "Invalid openapi-mode. Check your configuration." in error


# If this test is failing, run postgrest-test-io --snapshot-update -k test_schema_cache_snapshot
@pytest.mark.parametrize(
    "key",
    [
        "dbMediaHandlers",
        "dbRelationships",
        "dbRepresentations",
        "dbRoutines",
        "dbTables",
    ],
)
def test_schema_cache_snapshot(baseenv, key, snapshot_yaml):
    "Dump of schema cache should match snapshot."

    schema_cache = yaml.load(cli(["--dump-schema"], env=baseenv), Loader=yaml.Loader)
    formatted = yaml.dump(
        schema_cache[key],
        encoding="utf8",
        allow_unicode=True,
        Dumper=ExtraNewLinesDumper,
    )
    assert formatted == snapshot_yaml


def test_jwt_aud_config_set_to_invalid_uri(defaultenv):
    "PostgREST should exit with an error message in output if jwt-aud config is set to an invalid URI"
    env = {
        **defaultenv,
        "PGRST_JWT_AUD": "foo://%%$$^^.com",
    }

    error = cli(["--dump-config"], env=env, expect_error=True)
    assert "jwt-aud should be a string or a valid URI" in error


def test_jwt_secret_min_length(defaultenv):
    "Should log error and not load the config when the secret is shorter than the minimum admitted length"

    env = {**defaultenv, "PGRST_JWT_SECRET": "short_secret"}

    error = cli(["--dump-config"], env=env, expect_error=True)
    assert "The JWT secret must be at least 32 characters long." in error


def test_invalid_client_error_verbosity(defaultenv):
    "Given an invalid value for client-error-verbosity, Postgrest should exit with a non-zero exit code."
    env = {
        **defaultenv,
        "PGRST_CLIENT_ERROR_VERBOSITY": "invalid",
    }

    error = cli(["--dump-config"], env=env, expect_error=True)
    assert "Invalid client-error-verbosity. Check your configuration." in error


@pytest.mark.parametrize("restricted_schema", FIXTURES["restrictedschemas"])
def test_restricted_db_schemas(restricted_schema, defaultenv):
    "Should print error when db-schemas config contain pg_catalog or information_schema"

    # test when single schema is given in db-schemas
    env = {**defaultenv, "PGRST_DB_SCHEMAS": restricted_schema}
    error = cli(["--dump-config"], env=env, expect_error=True)
    assert f"db-schemas does not allow schema: '{restricted_schema}'" in error

    # test when multiple schemas are given in db-schemas
    env = {**defaultenv, "PGRST_DB_SCHEMAS": f"public, {restricted_schema}"}
    error = cli(["--dump-config"], env=env, expect_error=True)
    assert f"db-schemas does not allow schema: '{restricted_schema}'" in error


# TODO: Improve readability of "--ready" healthcheck tests
@pytest.mark.parametrize("host", ["127.0.0.1", "::1"], ids=["IPv4", "IPv6"])
def test_cli_ready_flag_success(host, defaultenv):
    "test PostgREST ready flag succeeds when ready"

    port = freeport()
    admin_port = freeport(used_ports=[port])

    with run(env=defaultenv, host=host, port=port, admin_port=admin_port) as postgrest:
        output = cli(["--ready"], env=postgrest.config)

        admin_host, admin_port = get_admin_host_and_port_from_config(postgrest.config)

        if is_ipv6(host):
            assert f"OK: http://[{admin_host}]:{admin_port}/ready" in output
        else:
            assert f"OK: http://{admin_host}:{admin_port}/ready" in output


def test_cli_ready_flag_fail_when_schema_cache_not_loaded(defaultenv, metapostgrest):
    "test PosgREST ready flag fail when schema cache not loaded"

    role = "timeout_authenticator"

    env = {
        **defaultenv,
        "PGUSER": role,
        "PGRST_DB_ANON_ROLE": role,
        "PGRST_INTERNAL_SCHEMA_CACHE_QUERY_SLEEP": "500",
    }

    port = freeport()
    admin_port = freeport(used_ports=[port])

    with run(env=env, port=port, admin_port=admin_port) as postgrest:
        # The schema cache query takes at least 500ms, due to PGRST_INTERNAL_SCHEMA_CACHE_QUERY_SLEEP above.
        # Make it impossible to load the schema cache, by setting statement timeout to 400ms.
        set_statement_timeout(metapostgrest, role, 400)

        # force a reconnection so the new role setting is picked up
        postgrest.process.send_signal(signal.SIGUSR1)

        postgrest.wait_until_scache_starts_loading()

        output = cli(["--ready"], env=postgrest.config, expect_error=True)
        admin_host, admin_port = get_admin_host_and_port_from_config(postgrest.config)

        assert f"ERROR: http://{admin_host}:{admin_port}/ready" in output


def test_cli_ready_flag_fail_with_http_exception(defaultenv):
    "test PostgREST ready flag fail when http exception occurs"

    port = freeport()
    admin_port = freeport(used_ports=[port])

    # when healthcheck process sends the request to a wrong endpoint
    with run(env=defaultenv, port=port, admin_port=admin_port) as postgrest:
        # we set it to some freeport where server and admin server is not running
        used_ports = [port, admin_port]

        postgrest.config["PGRST_ADMIN_SERVER_PORT"] = str(freeport(used_ports))
        output = cli(["--ready"], env=postgrest.config, expect_error=True)
        admin_host, admin_port = get_admin_host_and_port_from_config(postgrest.config)

        assert (
            f"ERROR: connection refused to http://{admin_host}:{admin_port}/ready"
            in output
        )

    # When client sends the request to invalid URL
    with run(env=defaultenv, port=port, admin_port=admin_port) as postgrest:
        postgrest.config["PGRST_ADMIN_SERVER_PORT"] = str(-1)
        output = cli(["--ready"], env=postgrest.config, expect_error=True)
        admin_host, admin_port = get_admin_host_and_port_from_config(postgrest.config)

        assert f"ERROR: invalid url - http://{admin_host}:{admin_port}/ready" in output


def test_cli_ready_flag_fail_with_special_hostname(defaultenv):
    "test PostgREST ready flag fail when http exception occurs"

    port = freeport()
    host = "*4"

    with run(env=defaultenv, host=host, port=port, admin_port=freeport()) as postgrest:
        output = cli(["--ready"], env=postgrest.config, expect_error=True)

        assert (
            f'ERROR: The `--ready` flag cannot be used when server-host is configured as "{host}". Please update your server-host config to "localhost".'
            in output
        )


def test_cli_ready_flag_fail_when_no_admin_server(defaultenv):
    "test PostgREST ready flag fail when admin server not running"

    with run(env=defaultenv) as postgrest:
        # We set admin-server-port to <empty> to disable admin server
        postgrest.config["PGRST_ADMIN_SERVER_PORT"] = ""
        output = cli(["--ready"], env=postgrest.config, expect_error=True)

        assert (
            "ERROR: Admin server is not running. Please check admin-server-port config."
            in output
        )
