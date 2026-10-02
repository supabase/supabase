import time

from util import Thread
from postgrest import run


def test_graceful_shutdown_waits_for_in_flight_request(defaultenv):
    "SIGTERM should allow in-flight requests to finish before exiting"

    with run(env=defaultenv, wait_max_seconds=5) as postgrest:

        def sleep():
            response = postgrest.session.get("/rpc/sleep?seconds=3", timeout=10)
            assert response.text == ""
            assert response.status_code == 204

        t = Thread(target=sleep)
        t.start()

        # Wait for the request to be in-flight before shutting down.
        time.sleep(1)

        postgrest.process.terminate()

        t.join()
