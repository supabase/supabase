import re
import threading
import jwt
import subprocess
from datetime import datetime, timedelta, timezone


class Thread(threading.Thread):
    "Variant of threading.Thread that re-raises any exceptions when joining the thread"

    def __init__(self, *args, **kwargs):
        self._exception = None
        super(Thread, self).__init__(*args, **kwargs)

    def run(self):
        try:
            super(Thread, self).run()
        except Exception as e:
            self._exception = e

    def join(self):
        super(Thread, self).join()
        if self._exception is not None:
            raise self._exception


def match_log(output, matchers):
    ito = iter(output)
    itm = iter(matchers)
    nextMatcher = next(itm, None)
    while nextMatcher is not None and (line := next(ito, None)) is not None:
        if re.match(nextMatcher, line) is not None:
            nextMatcher = next(itm, None)
    if nextMatcher is not None:
        raise AssertionError(
            f"Expected log line matching {nextMatcher} not found in output"
        )


def drain_stdout(proc):
    lines = []
    while True:
        chunk = proc.read_stdout(nlines=20)
        if not chunk:
            break
        lines.extend(chunk)
    return lines


def authheader(token):
    "Bearer token HTTP authorization header."
    return {"Authorization": f"Bearer {token}"}


def jwtauthheader(claim, secret):
    "Authorization header with signed JWT."
    return authheader(jwt.encode(claim, secret))


def relativeSeconds(sec):
    return int((datetime.now(timezone.utc) + timedelta(seconds=sec)).timestamp())


def parse_server_timings_header(header):
    """Parse the Server-Timing header into a dict of metric names to values.

    The header is a comma-separated list of metrics, each of which has a name
    and a duration. The duration may be followed by a semicolon and a list of
    parameters, but we ignore those.

    See https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Server-Timing
    """
    timings = {}
    for timing in header.split(","):
        name, duration_text, *_ = timing.split(";")
        _, duration = duration_text.split("=")
        timings[name.strip()] = float(duration)
    return timings


def psql_as_superuser(query, capture_output=False):
    cmd = [
        "psql",
        "--username",
        "postgres",
        "--set",
        "ON_ERROR_STOP=1",
    ]
    if capture_output:
        cmd.extend(["--tuples-only", "--no-align"])
    cmd.extend(["-c", query])

    if capture_output:
        return subprocess.check_output(cmd, text=True)

    subprocess.check_call(cmd)
