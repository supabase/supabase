"""
Unit tests for the multi-database compose and Envoy generator scripts.
Run with: python3 -m pytest scripts/test_generators.py -v
Or:        python3 scripts/test_generators.py
"""

import json
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

REPO_ROOT = Path(__file__).parent.parent

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_registry(databases: list) -> dict:
    return {"version": "1", "databases": databases}

def default_db(ref="default", host="db", port=5432, password_env="POSTGRES_PASSWORD"):
    return {
        "ref": ref,
        "name": f"DB {ref}",
        "host": host,
        "port": port,
        "database": "postgres",
        "password_env": password_env,
        "jwt_secret_env": "JWT_SECRET",
    }

def write_registry(path: Path, databases: list):
    path.write_text(json.dumps(make_registry(databases), indent=2))


# ---------------------------------------------------------------------------
# Registry JSON
# ---------------------------------------------------------------------------

class TestRegistryJson(unittest.TestCase):
    def setUp(self):
        self.registry_path = REPO_ROOT / "docker/volumes/registry/databases.json"

    def test_registry_file_exists(self):
        self.assertTrue(self.registry_path.exists(), "databases.json not found")

    def test_registry_valid_json(self):
        data = json.loads(self.registry_path.read_text())
        self.assertIn("version", data)
        self.assertIn("databases", data)
        self.assertIsInstance(data["databases"], list)

    def test_registry_has_at_least_one_database(self):
        data = json.loads(self.registry_path.read_text())
        self.assertGreater(len(data["databases"]), 0)

    def test_all_entries_have_required_fields(self):
        required = {"ref", "name", "host", "port", "database", "password_env", "jwt_secret_env"}
        data = json.loads(self.registry_path.read_text())
        for db in data["databases"]:
            missing = required - set(db.keys())
            self.assertFalse(missing, f"DB '{db.get('ref','?')}' missing fields: {missing}")

    def test_all_refs_are_unique(self):
        data = json.loads(self.registry_path.read_text())
        refs = [db["ref"] for db in data["databases"]]
        self.assertEqual(len(refs), len(set(refs)), "Duplicate refs found in registry")

    def test_port_values_are_integers(self):
        data = json.loads(self.registry_path.read_text())
        for db in data["databases"]:
            self.assertIsInstance(db["port"], int, f"Port for {db['ref']} must be int")


# ---------------------------------------------------------------------------
# generate-compose-storage.py
# ---------------------------------------------------------------------------

class TestGenerateComposeStorage(unittest.TestCase):
    def _run_generator(self, databases: list) -> str:
        """Run generate-compose-storage.py against a temp registry, return output."""
        script = REPO_ROOT / "scripts/generate-compose-storage.py"
        if not script.exists():
            self.skipTest("generate-compose-storage.py not found")

        import importlib.util, io
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            json.dump(make_registry(databases), f)
            reg_path = f.name

        try:
            captured = io.StringIO()
            env_patch = {"DATABASE_REGISTRY_PATH": reg_path}
            spec = importlib.util.spec_from_file_location("gen_storage", str(script))
            # We test by importing and checking what it would produce
            # Most generators read the registry path from env
            import subprocess
            result = subprocess.run(
                [sys.executable, str(script), "--registry", reg_path],
                capture_output=True, text=True
            )
            return result.stdout + result.stderr
        finally:
            os.unlink(reg_path)

    def test_script_runs_without_error(self):
        script = REPO_ROOT / "scripts/generate-compose-storage.py"
        if not script.exists():
            self.skipTest("generate-compose-storage.py not found")
        import subprocess
        result = subprocess.run(
            [sys.executable, str(script), "--help"],
            capture_output=True, text=True
        )
        # --help either exits 0 or exits 2 (argparse), but should not crash with traceback
        self.assertNotIn("Traceback", result.stderr)

    def test_generates_service_per_database(self):
        script = REPO_ROOT / "scripts/generate-compose-storage.py"
        if not script.exists():
            self.skipTest("generate-compose-storage.py not found")

        output_file = REPO_ROOT / "docker/docker-compose.storage.yml"
        if not output_file.exists():
            self.skipTest("docker-compose.storage.yml not generated yet")

        content = output_file.read_text()
        data = json.loads((REPO_ROOT / "docker/volumes/registry/databases.json").read_text())
        for db in data["databases"]:
            ref = db["ref"]
            # Each db should have a storage service named storage-{ref} or supabase-storage-{ref}
            self.assertTrue(
                f"storage-{ref}" in content or f"supabase-storage-{ref}" in content,
                f"No storage service found for ref={ref} in docker-compose.storage.yml"
            )


# ---------------------------------------------------------------------------
# generate-compose-auth.py
# ---------------------------------------------------------------------------

class TestGenerateComposeAuth(unittest.TestCase):
    def test_generated_auth_compose_has_service_per_db(self):
        compose = REPO_ROOT / "docker/docker-compose.auth.yml"
        if not compose.exists():
            self.skipTest("docker-compose.auth.yml not generated yet")

        content = compose.read_text()
        data = json.loads((REPO_ROOT / "docker/volumes/registry/databases.json").read_text())
        for db in data["databases"]:
            ref = db["ref"]
            self.assertTrue(
                f"auth-{ref}" in content or f"supabase-auth-{ref}" in content,
                f"No auth service for ref={ref} in docker-compose.auth.yml"
            )

    def test_auth_services_have_gotrue_env(self):
        compose = REPO_ROOT / "docker/docker-compose.auth.yml"
        if not compose.exists():
            self.skipTest("docker-compose.auth.yml not generated yet")

        content = compose.read_text()
        self.assertIn("GOTRUE_DB_DATABASE_URL", content)
        self.assertIn("GOTRUE_JWT_SECRET", content)


# ---------------------------------------------------------------------------
# generate-compose-rest.py
# ---------------------------------------------------------------------------

class TestGenerateComposeRest(unittest.TestCase):
    def test_generated_rest_compose_has_service_per_db(self):
        compose = REPO_ROOT / "docker/docker-compose.rest.yml"
        if not compose.exists():
            self.skipTest("docker-compose.rest.yml not generated yet")

        content = compose.read_text()
        data = json.loads((REPO_ROOT / "docker/volumes/registry/databases.json").read_text())
        for db in data["databases"]:
            ref = db["ref"]
            self.assertTrue(
                f"rest-{ref}" in content or f"supabase-rest-{ref}" in content,
                f"No rest service for ref={ref} in docker-compose.rest.yml"
            )

    def test_rest_services_have_pgrst_db_uri(self):
        compose = REPO_ROOT / "docker/docker-compose.rest.yml"
        if not compose.exists():
            self.skipTest("docker-compose.rest.yml not generated yet")

        content = compose.read_text()
        self.assertIn("PGRST_DB_URI", content)


# ---------------------------------------------------------------------------
# Envoy config
# ---------------------------------------------------------------------------

class TestEnvoyConfig(unittest.TestCase):
    def test_lds_template_has_xproject_ref_routing(self):
        lds = REPO_ROOT / "docker/volumes/api/envoy/lds.template.yaml"
        if not lds.exists():
            self.skipTest("lds.template.yaml not found")

        content = lds.read_text()
        self.assertIn("X-Project-Ref", content)

    def test_lds_per_project_routes_come_before_defaults(self):
        lds = REPO_ROOT / "docker/volumes/api/envoy/lds.template.yaml"
        if not lds.exists():
            self.skipTest("lds.template.yaml not found")

        content = lds.read_text()
        # Per-project routes must appear before the DEFAULT catch-all
        alpha_pos = content.find("project-alpha")
        default_route_pos = content.find("DEFAULT ROUTES")
        if alpha_pos == -1:
            self.skipTest("No per-project routes in lds.template.yaml yet")
        self.assertLess(alpha_pos, default_route_pos,
                        "Per-project routes must come before the default catch-all routes")

    def test_cds_has_auth_and_rest_clusters_per_db(self):
        cds = REPO_ROOT / "docker/volumes/api/envoy/cds.yaml"
        if not cds.exists():
            self.skipTest("cds.yaml not found")

        content = cds.read_text()
        data = json.loads((REPO_ROOT / "docker/volumes/registry/databases.json").read_text())
        for db in data["databases"]:
            ref = db["ref"]
            has_auth = f"auth-{ref}" in content
            has_rest = f"rest-{ref}" in content
            # At least one of auth or rest cluster should exist per DB
            self.assertTrue(
                has_auth or has_rest,
                f"No auth or rest cluster found for ref={ref} in cds.yaml"
            )


# ---------------------------------------------------------------------------
# Supavisor pooler.exs
# ---------------------------------------------------------------------------

class TestPoolerExs(unittest.TestCase):
    def setUp(self):
        self.pooler = REPO_ROOT / "docker/volumes/pooler/pooler.exs"

    def test_pooler_reads_registry(self):
        if not self.pooler.exists():
            self.skipTest("pooler.exs not found")
        content = self.pooler.read_text()
        self.assertIn("databases.json", content)

    def test_pooler_has_fallback_to_env_vars(self):
        if not self.pooler.exists():
            self.skipTest("pooler.exs not found")
        content = self.pooler.read_text()
        self.assertIn("POSTGRES_HOST", content)
        self.assertIn("POSTGRES_PASSWORD", content)

    def test_pooler_iterates_databases(self):
        if not self.pooler.exists():
            self.skipTest("pooler.exs not found")
        content = self.pooler.read_text()
        self.assertIn("Enum.each", content)

    def test_pooler_creates_tenant_per_db(self):
        if not self.pooler.exists():
            self.skipTest("pooler.exs not found")
        content = self.pooler.read_text()
        self.assertIn("create_tenant", content)


# ---------------------------------------------------------------------------
# init-database.sh
# ---------------------------------------------------------------------------

class TestInitDatabaseSh(unittest.TestCase):
    def setUp(self):
        self.script = REPO_ROOT / "scripts/init-database.sh"

    def test_script_exists(self):
        self.assertTrue(self.script.exists())

    def test_script_is_executable_or_can_be_sourced(self):
        import subprocess
        result = subprocess.run(["bash", "-n", str(self.script)], capture_output=True)
        self.assertEqual(result.returncode, 0, f"Syntax error: {result.stderr.decode()}")

    def test_script_applies_supabase_schemas(self):
        content = self.script.read_text()
        # Should reference core Supabase SQL init files
        self.assertTrue(
            any(kw in content for kw in ["roles.sql", "auth", "realtime", "storage", "init"]),
            "init-database.sh should apply Supabase schema SQL files"
        )


if __name__ == "__main__":
    loader = unittest.TestLoader()
    suite = loader.loadTestsFromModule(sys.modules[__name__])
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    sys.exit(0 if result.wasSuccessful() else 1)