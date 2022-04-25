import os
import pytest
import psycopg


@pytest.fixture(scope="function")
def db():
    with psycopg.connect(
        host=os.environ.get("SUPABASE_DB_HOST"),
        port=os.environ.get("SUPABASE_DB_PORT"),
        user="postgres",
        password=os.environ.get("SUPABASE_DB_PASS"),
        dbname="postgres",
    ) as conn:
        yield conn
