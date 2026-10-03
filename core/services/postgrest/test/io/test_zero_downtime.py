import time

from util import Thread
from postgrest import (
    freeport,
    run,
    wait_until_exit,
)


def test_so_reuseport_zero_downtime_handover(defaultenv):
    "A second PostgREST instance should take over on the same main/admin ports without request failures."

    # set host to _all_ addresses to force port conflict without SO_REUSEPORT
    # setting to localhost (which is the default)
    # might allow running multiple instances on the same port
    # as the name might be resolved to many IP addresses
    host = "0.0.0.0"
    port = freeport()
    admin_port = freeport(used_ports=[port])
    failures = []
    # mutable location shared between threads
    keep_running = {"value": True}

    # 1. Start first PostgREST instance
    # 2. Start a "client" thread issuing requests in a loop
    #    remembering all received errors
    # 3. Start second PostgREST instance on the same port as the first one
    # 4. Wait a little and terminate the first instance
    #
    # We expect the client does not get any errors after stopping the first instance
    # and seamlessly migrate to the second instance.
    #
    # 5. Stop client thread
    # 6. Stop second PostgREST instance
    # 7. Verify client did not get any errors
    with run(
        env={**defaultenv, "PGRST_SERVER_REUSEPORT": "true"},
        port=port,
        host=host,
        admin_port=admin_port,
    ) as first:

        def continuously_request():
            while keep_running["value"]:
                try:
                    response = first.session.get("/projects", timeout=1)
                    assert response.status_code == 200
                except Exception as exc:
                    failures.append(exc)
                    break
                time.sleep(0.2)

        requester = Thread(target=continuously_request)
        requester.start()

        try:
            time.sleep(1)
            with run(
                env={**defaultenv, "PGRST_SERVER_REUSEPORT": "true"},
                port=port,
                host=host,
                # we do not set SO_REUSEPORT on admin socket
                admin_port=freeport(used_ports=[port, admin_port]),
            ):
                time.sleep(1)
                first.process.terminate()
                wait_until_exit(first, 2)

                time.sleep(1)
        finally:
            keep_running["value"] = False
            requester.join()

    assert failures == []
