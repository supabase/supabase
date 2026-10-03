"IO tests for PostgREST started on replicas"

import os
import time

from postgrest import run
from util import Thread


def test_sanity_replica(replicaenv):
    "Test that primary and replica are working as intended"

    with run(env=replicaenv["primary"]) as postgrest:
        response = postgrest.session.get("/rpc/is_replica")
        assert response.text == "false"

        response = postgrest.session.get("/rpc/get_replica_slot")
        assert response.text == '"' + replicaenv["replica"]["PGREPLICASLOT"] + '"'

        response = postgrest.session.get("/items?select=count")
        assert response.text == '[{"count":10}]'

    with run(env=replicaenv["replica"]) as postgrest:
        response = postgrest.session.get("/rpc/is_replica")
        assert response.text == "true"

        response = postgrest.session.get("/items?select=count")
        assert response.text == '[{"count":10}]'


def test_conflict_replica(replicaenv):
    "Test that PostgREST does not retry the transaction on conflict with recovery (PG error code 40001)"

    with run(env=replicaenv["replica"]) as postgrest:

        def conflict():
            response = postgrest.session.get("/conflict_view")
            # Checks that the transaction stops and returns the 40001 error instead of retrying
            assert response.json()["code"] == "40001"
            assert response.status_code == 500

        t = Thread(target=conflict)
        t.start()

        # make sure the request has started
        time.sleep(0.1)

        prienv = replicaenv["primary"]
        connopts = f'-d {prienv["PGDATABASE"]} -U postgres -h {prienv["PGHOST"]}'

        # Delete the table data while the request with the lock is running to trigger the recovery conflict
        os.system(
            f'psql {connopts} --set ON_ERROR_STOP=1 -a -c "DELETE FROM replica.conflict;"'
        )
        # Vacuum the table to accelerate the process
        os.system(f"vacuumdb {connopts} -t replica.conflict")

        t.join()
