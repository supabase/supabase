"""PostgreSQL extension testing framework for multi-version compatibility.

This module provides a test framework for PostgreSQL extensions that need to be
tested across multiple PostgreSQL versions and extension versions. It handles
installation, upgrades, and version verification of PostgreSQL extensions.
"""

from typing import Sequence, Mapping, Optional
from pathlib import Path
from test_driver.machine import Machine

Versions = Mapping[str, Sequence[str]]


class PostgresExtensionTest(object):
    def __init__(
        self,
        vm: Machine,
        extension_name: str,
        versions: Versions,
        sql_test_dir: Path,
        support_upgrade: bool = True,
        schema: str = "public",
        lib_name: Optional[str] = None,
    ):
        """Initialize the PostgreSQL extension test framework.

        Args:
            vm: Test machine instance for executing commands
            extension_name: Name of the PostgreSQL extension to test
            versions: Mapping of PostgreSQL versions to available extension versions
            sql_test_dir: Directory containing SQL test files for pg_regress
            support_upgrade: Whether the extension supports in-place upgrades
            lib_name: Name of the shared library (defaults to extension_name)
        """
        self.vm = vm
        self.extension_name = extension_name
        self.versions = versions
        self.support_upgrade = support_upgrade
        self.sql_test_dir = sql_test_dir
        self.schema = schema
        self.lib_name = lib_name or extension_name

    def create_schema(self):
        self.run_sql(f"CREATE SCHEMA IF NOT EXISTS {self.schema};")

    def run_sql(self, query: str) -> str:
        return self.vm.succeed(
            f"""psql -U supabase_admin -d postgres -t -A -F\",\" -c \"{query}\" """
        ).strip()

    def run_sql_file(self, file: str) -> str:
        return self.vm.succeed(
            f"""psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 -f \"{file}\""""
        ).strip()

    def drop_extension(self):
        self.run_sql(f"DROP EXTENSION IF EXISTS {self.extension_name};")

    def install_extension(self, version: str):
        if self.schema != "public":
            ext_schema = f"SCHEMA {self.schema} "
        else:
            ext_schema = ""
        self.run_sql(
            f"""CREATE EXTENSION {self.extension_name} WITH {ext_schema}VERSION '{version}' CASCADE;"""
        )
        # Verify version was installed correctly
        self.assert_version_matches(version)

    def update_extension(self, version: str):
        self.run_sql(
            f"""ALTER EXTENSION {self.extension_name} UPDATE TO '{version}';"""
        )
        # Verify version was installed correctly
        self.assert_version_matches(version)

    def get_installed_version(self) -> str:
        """Get the currently installed version of the extension.

        Returns:
            Version string of the currently installed extension,
            or empty string if extension is not installed
        """
        return self.run_sql(
            f"""SELECT extversion FROM pg_extension WHERE extname = '{self.extension_name}';"""
        )

    def assert_version_matches(self, expected_version: str):
        """Check if the installed version matches the expected version.

        Args:
            expected_version: Expected version string to verify against

        Raises:
            AssertionError: If the installed version does not match the expected version
        """
        installed_version = self.get_installed_version()
        assert installed_version == expected_version, (
            f"Expected version {expected_version}, but found {installed_version}"
        )

    def check_upgrade_path(self, pg_version: str):
        """Test the complete upgrade path for a PostgreSQL version.

        This method tests all available extension versions for a given PostgreSQL
        version, either through in-place upgrades or reinstallation depending on
        the support_upgrade setting.

        Args:
            pg_version: PostgreSQL version to test (e.g., "14", "15")

        Raises:
            ValueError: If no versions are available for the specified PostgreSQL version
            AssertionError: If version installation or upgrade fails
        """
        available_versions = self.versions.get(pg_version, [])
        if not available_versions:
            raise ValueError(
                f"No versions available for PostgreSQL version {pg_version}"
            )

        # Install and verify first version
        first_version = available_versions[0]
        self.drop_extension()
        self.install_extension(first_version)

        # Test remaining versions
        for version in available_versions[1:]:
            if self.support_upgrade:
                self.update_extension(version)
            else:
                self.drop_extension()
                self.install_extension(version)

    def check_legacy_versions_upgrade_to_latest(
        self, pg_version: str, legacy_versions: Mapping[str, str]
    ):
        """Verify every legacy extversion string upgrades to latest.

        legacy_versions maps a legacy/bare extversion string (e.g. "1.6") to
        its schema-identical canonical version (e.g. "1.6.4"). Postgres has
        no base script for the legacy string, only an alignment edge off of
        it, so CREATE EXTENSION can't target it directly: install the
        canonical version, patch pg_extension.extversion to the legacy
        string, then run a bare ALTER EXTENSION UPDATE and assert it reaches
        latest. Restores latest on exit for subsequent subtests.

        Args:
            pg_version: PostgreSQL version under test (e.g. "15")
            legacy_versions: Mapping of legacy extversion string to its
                schema-identical canonical version
        """
        if not legacy_versions:
            return

        available = self.versions.get(pg_version, [])
        if not available:
            raise ValueError(
                f"No versions available for PostgreSQL version {pg_version}"
            )
        latest = available[-1]

        for legacy_version, canonical_version in legacy_versions.items():
            self.drop_extension()
            self.install_extension(canonical_version)
            self.run_sql(
                f"UPDATE pg_extension SET extversion = '{legacy_version}' "
                f"WHERE extname = '{self.extension_name}';"
            )
            self.run_sql(f"ALTER EXTENSION {self.extension_name} UPDATE;")
            self.assert_version_matches(latest)

        # Restore canonical latest so following subtests have expected state
        self.drop_extension()
        self.install_extension(latest)

    def check_install_last_version(self, pg_version: str) -> str:
        """Test if the install of the last version of the extension works for a given PostgreSQL version.

        Args:
            pg_version: PostgreSQL version to check (e.g., "14", "15")
        """
        available_versions = self.versions.get(pg_version, [])
        if not available_versions:
            raise ValueError(
                f"No versions available for PostgreSQL version {pg_version}"
            )
        last_version = available_versions[-1]
        self.drop_extension()
        self.install_extension(last_version)
        return last_version

    def check_switch_extension_with_background_worker(
        self, extension_lib_path: Path, pg_version: str
    ):
        """Test manual switching between two versions of an extension with a background worker.

        Args:
            extension_lib_path: Path to the directory containing the extension shared library of the extension
            pg_version: PostgreSQL version to check (e.g., "14", "15")
        """
        # Check that we are using the last version first
        ext_version = self.vm.succeed(f"readlink -f {extension_lib_path}").strip()
        available_versions = self.versions.get(pg_version, [])
        if not available_versions:
            raise ValueError(
                f"No versions available for PostgreSQL version {pg_version}"
            )
        last_version = available_versions[-1]
        assert ext_version.endswith(f"{self.lib_name}-{last_version}.so"), (
            f"Expected {self.extension_name} version {last_version}, but found {ext_version}"
        )

        # Switch to the first version
        first_version = available_versions[0]
        self.vm.succeed(f"switch_{self.extension_name}_version {first_version}")

        # Check that we are using the first version now
        ext_version = self.vm.succeed(f"readlink -f {extension_lib_path}").strip()
        assert ext_version.endswith(f"{self.lib_name}-{first_version}.so"), (
            f"Expected {self.extension_name} version {first_version}, but found {ext_version}"
        )

        # Switch to the last version
        self.vm.succeed(f"switch_{self.extension_name}_version {last_version}")
        # Check that we are using the last version now
        ext_version = self.vm.succeed(f"readlink -f {extension_lib_path}").strip()
        assert ext_version.endswith(f"{self.lib_name}-{last_version}.so"), (
            f"Expected {self.extension_name} version {last_version}, but found {ext_version}"
        )

    def check_pg_regress(self, pg_regress: Path, pg_version: str, test_name: str):
        """Run pg_regress tests for the extension on a given PostgreSQL version.

        Args:
            pg_regress: Path to the pg_regress binary
            pg_version: PostgreSQL version to test (e.g., "14", "15")
            test_name: SQL test file to run with pg_regress
        """
        sql_file = self.sql_test_dir / "sql" / f"{test_name}.sql"
        if not sql_file.exists():
            # check if we have a postgres version specific sql file
            test_name = f"z_{pg_version}_{test_name}"
            sql_file = self.sql_test_dir / "sql" / f"{test_name}.sql"
            if not sql_file.exists():
                print(f"Skipping pg_regress test for {pg_version}, no sql file found")
                return
        try:
            print(
                self.vm.succeed(
                    f"""sudo -u postgres {pg_regress} --inputdir={self.sql_test_dir} --debug --use-existing --dbname=postgres --outputdir=/tmp/regression_output_{pg_version} "{test_name}" """
                )
            )
        except:
            print("Error running pg_regress, diff:")
            print(
                self.vm.succeed(
                    f"cat /tmp/regression_output_{pg_version}/regression.diffs"
                )
            )
            raise
