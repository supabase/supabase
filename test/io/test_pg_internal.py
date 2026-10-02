from util import psql_as_superuser
from postgrest import run


def test_listener_query_is_visible_in_pg_stat_activity(defaultenv):
    "The listener connection should show the LISTEN pgrst statement in pg_stat_activity"

    env = {
        **defaultenv,
        "PGRST_DB_CHANNEL_ENABLED": "true",
        "PGAPPNAME": "listener-query-test",
    }

    with run(env=env):
        output = psql_as_superuser(
            """
        select query
        from pg_stat_activity
        where application_name = 'listener-query-test'
          and query = 'LISTEN "pgrst"'
        limit 1;
        """,
            capture_output=True,
        ).strip()

        assert output == 'LISTEN "pgrst"'
