"Fixtures to run PostgREST as a server."

import contextlib
import dataclasses
import enum
import os
import pathlib
import socket
import subprocess
import tempfile
import time
import string
import urllib.parse

import requests
import requests_unixsocket

from config import POSTGREST_BIN, NGINX_BIN, hpctixfile


def sleep_until_postgrest_scache_reload():
    "Sleep until schema cache reload"
    time.sleep(0.3)


def sleep_until_postgrest_config_reload():
    "Sleep until config reload"
    time.sleep(0.2)


def sleep_until_postgrest_full_reload():
    "Sleep until schema cache plus config reload"
    time.sleep(0.3)


class PostgrestTimedOut(Exception):
    "Connecting to PostgREST endpoint timed out."


class Admin(str, enum.Enum):
    "Admin endpoint to wait for before yielding a PostgREST process."

    live = "live"
    ready = "ready"


class PostgrestSession(requests_unixsocket.Session):
    "HTTP client session directed at a PostgREST endpoint."

    def __init__(self, baseurl, *args, **kwargs):
        super(PostgrestSession, self).__init__(*args, **kwargs)
        self.baseurl = baseurl

    def request(self, method, url, *args, **kwargs):
        # Not using urllib.parse.urljoin to compose the url, as it doesn't play
        # well with our 'http+unix://' unix domain socket urls.
        fullurl = self.baseurl + url
        return super(PostgrestSession, self).request(method, fullurl, *args, **kwargs)


@dataclasses.dataclass
class PostgrestProcess:
    "Running PostgREST process and its corresponding main and admin endpoints."

    admin: object
    process: object
    session: object
    config: object

    def read_stdout(self, nlines=1):
        "Wait for line(s) on standard output."
        output = []
        for _ in range(10):
            self.process.stdout.flush()
            line = self.process.stdout.readline()
            if line:
                output.append(line.decode())
                if len(output) >= nlines:
                    break
            time.sleep(0.1)
        return output

    def wait_until_scache_starts_loading(self, max_seconds=1):
        "Wait for the admin /ready return a status of 503"

        wait_until_status_code(
            self.admin.baseurl + "/ready", max_seconds=max_seconds, status_code=503
        )


@contextlib.contextmanager
def run(
    configpath=None,
    stdin=None,
    env=None,
    args=None,
    port=None,
    admin_port=None,
    host=None,
    wait_for=Admin.ready,
    wait_max_seconds=1,
    no_pool_connection_available=False,
    no_startup_stdout=True,
):
    "Run PostgREST and yield an endpoint that is ready for connections."

    with tempfile.TemporaryDirectory() as tmpdir:

        # with python requests, "localhost" doesn't automatically resolves
        # to [::1], hence we use this explicitly when host is ipv6 special
        # address
        ipv6_special_addresses = ["*6", "!6"]

        localhost = "[::1]" if host in ipv6_special_addresses else "localhost"

        if port:
            env["PGRST_SERVER_PORT"] = str(port)
            env["PGRST_SERVER_HOST"] = host or localhost
            # When constructing IPv6 address, host address should be bracketed like [host]
            apihost = f"[{host}]" if host and is_ipv6(host) else localhost
            baseurl = f"http://{apihost}:{port}"
        else:
            socketfile = pathlib.Path(tmpdir) / "postgrest.sock"
            env["PGRST_SERVER_UNIX_SOCKET"] = str(socketfile)
            baseurl = "http+unix://" + urllib.parse.quote_plus(str(socketfile))

        if admin_port:
            env["PGRST_ADMIN_SERVER_PORT"] = str(admin_port)
            adminhost = f"[{host}]" if host and is_ipv6(host) else localhost
            adminurl = f"http://{adminhost}:{admin_port}"
        else:
            socketfile = pathlib.Path(tmpdir) / "admin.sock"
            env["PGRST_ADMIN_SERVER_UNIX_SOCKET"] = str(socketfile)
            adminurl = "http+unix://" + urllib.parse.quote_plus(str(socketfile))

        command = [POSTGREST_BIN]
        env["HPCTIXFILE"] = hpctixfile()

        if args:
            command.extend(args)

        if configpath:
            command.append(configpath)

        process = subprocess.Popen(
            command,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            env=env,
        )

        os.set_blocking(process.stdout.fileno(), False)

        try:
            process.stdin.write(stdin or b"")
            process.stdin.close()

            if wait_for == Admin.ready:
                wait_until_status_code(adminurl + "/ready", wait_max_seconds, 200)
            elif wait_for == Admin.live:
                wait_until_status_code(adminurl + "/live", wait_max_seconds, 200)

            if no_startup_stdout:
                process.stdout.read()

            if no_pool_connection_available:
                sleep_pool_connection(baseurl, 10)

            yield PostgrestProcess(
                process=process,
                session=PostgrestSession(baseurl),
                admin=PostgrestSession(adminurl),
                config=env,
            )
        finally:
            remaining_output = process.stdout.read()
            if remaining_output:
                print(remaining_output.decode())
            process.terminate()
            try:
                process.wait(timeout=1)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait()


@contextlib.contextmanager
def run_pgproxy(env=None, proxy_timeout="1s"):
    "Run nginx as a unix socket proxy for PostgreSQL and expose PGPROXYHOST."
    env = dict(os.environ if env is None else env)

    with tempfile.TemporaryDirectory() as tmpdir:
        # build a <tmpdir>/conf/ so `nginx -p` picks the config automatically
        tmpdir = pathlib.Path(tmpdir)
        conf_dir = tmpdir / "conf"
        conf_dir.mkdir(parents=True)

        nginx_env = dict(env)
        nginx_env["PGPROXYHOST"] = str(tmpdir)
        nginx_env["PGPROXY_TIMEOUT"] = proxy_timeout

        source_conf = pathlib.Path("test/io/nginx/nginx.conf")
        out_conf = conf_dir / "nginx.conf"
        out_conf.write_text(
            string.Template(source_conf.read_text()).substitute(nginx_env)
        )

        process = subprocess.Popen(
            [NGINX_BIN, "-p", str(tmpdir), "-e", "stderr"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            env=nginx_env,
        )

        if process.poll() is not None:
            _, stderr_output = process.communicate(timeout=1)
            raise RuntimeError(
                f"{NGINX_BIN} exited with {process.returncode}: {stderr_output}"
            )

        try:
            yield str(tmpdir)
        finally:
            process.terminate()
            try:
                process.wait(timeout=1)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait()


def freeport(used_ports=None):
    "Find an unused free port on localhost."
    while True:
        with contextlib.closing(socket.socket(socket.AF_INET, socket.SOCK_STREAM)) as s:
            s.bind(("", 0))
            s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            port = s.getsockname()[1]
            if used_ports is None or port not in used_ports:
                return port


def wait_until_exit(postgrest, timeout=1):
    "Wait for PostgREST to exit, or times out"
    try:
        return postgrest.process.wait(timeout=timeout)
    except subprocess.TimeoutExpired:
        raise PostgrestTimedOut()


def wait_until_status_code(url, max_seconds, status_code):
    "Wait for the given HTTP endpoint to return a status code"
    session = requests_unixsocket.Session()

    response = None

    for _ in range(max_seconds * 10):
        try:
            response = session.get(url, timeout=1)
            if response.status_code == status_code:
                return
        except (requests.ConnectionError, requests.ReadTimeout):
            pass

        time.sleep(0.1)

    if response is not None:
        raise PostgrestTimedOut(f"{response.status_code}: {response.text}")
    else:
        raise PostgrestTimedOut()


def sleep_pool_connection(url, seconds):
    "Sleep a pool connection by calling an RPC that uses pg_sleep"
    session = requests_unixsocket.Session()

    # The try/except is a hack for not waiting for the response,
    # taken from https://stackoverflow.com/a/45601591/4692662
    try:
        session.get(url + f"/rpc/sleep?seconds={seconds}", timeout=0.1)
    except requests.exceptions.ReadTimeout:
        pass


def is_ipv6(addr):
    try:
        socket.inet_pton(socket.AF_INET6, addr)
        return True
    except OSError:
        return False


def set_statement_timeout(postgrest, role, milliseconds):
    """Set the statement timeout for the given role.
    For this to work reliably with low previous timeout settings,
    use a postgrest instance that doesn't use the affected role."""

    response = postgrest.session.post(
        "/rpc/set_statement_timeout", data={"role": role, "milliseconds": milliseconds}
    )
    assert response.text == ""
    assert response.status_code == 204


def reset_statement_timeout(postgrest, role):
    "Reset the statement timeout for the given role to the default 0 (no timeout)"
    set_statement_timeout(postgrest, role, 0)
