#!/usr/bin/env python3

import json

import pytest

from github_matrix import (
    NixEvalJobsOutput,
    get_runner_for_package,
    is_extension_pkg,
    is_virt_pkg,
    is_large_pkg,
    parse_nix_eval_line,
    sort_pkgs_by_closures,
)


class TestIsExtensionPkg:
    def test_extension_package(self):
        pkg: NixEvalJobsOutput = {
            "attr": "legacyPackages.x86_64-linux.psql_15.exts.pg_cron",
            "attrPath": [
                "legacyPackages",
                "x86_64-linux",
                "psql_15",
                "exts",
                "pg_cron",
            ],
            "cacheStatus": "notBuilt",
            "drvPath": "/nix/store/test.drv",
            "name": "pg_cron",
            "system": "x86_64-linux",
        }
        assert is_extension_pkg(pkg) is True

    def test_non_extension_package(self):
        pkg: NixEvalJobsOutput = {
            "attr": "legacyPackages.x86_64-linux.psql_15",
            "attrPath": ["legacyPackages", "x86_64-linux", "psql_15"],
            "cacheStatus": "notBuilt",
            "drvPath": "/nix/store/test.drv",
            "name": "postgresql-16.0",
            "system": "x86_64-linux",
        }
        assert is_extension_pkg(pkg) is False


class TestIsLargePkg:
    @pytest.mark.parametrize(
        "attr,expected",
        [
            ("legacyPackages.x86_64-linux.psql_15.exts.wrappers", True),
            ("legacyPackages.x86_64-linux.psql_15.exts.pg_jsonschema", True),
            ("legacyPackages.x86_64-linux.psql_15.exts.pg_graphql", True),
            ("legacyPackages.x86_64-linux.psql_15.exts.postgis", True),
            ("legacyPackages.x86_64-linux.psql_15.exts.pg_cron", False),
            ("legacyPackages.x86_64-linux.psql_15", False),
        ],
    )
    def test_large_package_detection(self, attr: str, expected: bool):
        pkg: NixEvalJobsOutput = {
            "attr": attr,
            "attrPath": attr.split("."),
            "cacheStatus": "notBuilt",
            "drvPath": f"/nix/store/{attr}.drv",
            "name": attr.split(".")[-1],
            "system": "x86_64-linux",
            "requiredSystemFeatures": ["big-parallel"] if expected else [],
        }
        assert is_large_pkg(pkg) is expected


class TestIsVirtPkg:
    @pytest.mark.parametrize(
        "feat,expected",
        [
            ("", False),
            ("apple-virt", True),
            ("big-parallel", False),
            ("kvm", True),
        ],
    )
    def test_is_virt_pkg(self, feat, expected):
        pkg: NixEvalJobsOutput = {
            "requiredSystemFeatures": [feat],
        }
        assert is_virt_pkg(pkg) is expected


class TestNixOSCheck:
    @pytest.mark.parametrize(
        "system,expected",
        [
            ("aarch64-darwin", False),
            ("aarch64-linux", True),
            ("x86_64-linux", True),
        ],
    )
    def test_system(self, system, expected):
        check = {
            "attr": f"attr-{system}",
            "drvPath": f"test_{system}",
            "system": system,
            "requiredSystemFeatures": ["nixos-test"],
        }
        result = parse_nix_eval_line(json.dumps(check), set())
        if expected:
            assert result._value is not None
        else:
            assert result._value is None


class TestGetRunnerForPackage:
    @pytest.mark.parametrize(
        "system,feature,expected",
        [
            (
                "aarch64-darwin",
                "apple-virt",
                {"group": "self-hosted-runners-nix", "labels": ["aarch64-darwin"]},
            ),
            (
                "aarch64-darwin",
                "big-parallel",
                {"labels": ["blacksmith-12vcpu-macos-26"]},
            ),
            (
                "aarch64-darwin",
                None,
                {"labels": ["blacksmith-6vcpu-macos-26"]},
            ),
            (
                "aarch64-linux",
                "kvm",
                {"labels": ["arm-native-runner"]},
            ),
            (
                "aarch64-linux",
                "big-parallel",
                {"labels": ["blacksmith-32vcpu-ubuntu-2404-arm"]},
            ),
            (
                "aarch64-linux",
                None,
                {"labels": ["blacksmith-8vcpu-ubuntu-2404-arm"]},
            ),
            (
                "x86_64-linux",
                "kvm",
                {"labels": ["blacksmith-16vcpu-ubuntu-2404"]},
            ),
            (
                "x86_64-linux",
                "big-parallel",
                {"labels": ["blacksmith-32vcpu-ubuntu-2404"]},
            ),
            (
                "x86_64-linux",
                None,
                {"labels": ["blacksmith-8vcpu-ubuntu-2404"]},
            ),
        ],
    )
    def test_get_runner_for_package(self, system, feature, expected):
        pkg: NixEvalJobsOutput = {
            "system": system,
        }
        if feature:
            pkg["requiredSystemFeatures"] = [feature]

        result = get_runner_for_package(pkg)
        assert result == expected


class TestSortPkgsByClosures:
    def test_empty_list(self):
        result = sort_pkgs_by_closures([])
        assert result == []

    def test_single_package(self):
        pkg: NixEvalJobsOutput = {
            "attr": "packages.x86_64-linux.psql_15",
            "attrPath": ["packages", "x86_64-linux", "psql_15"],
            "cacheStatus": "notBuilt",
            "drvPath": "/nix/store/test.drv",
            "name": "postgresql-16.0",
            "system": "x86_64-linux",
        }
        result = sort_pkgs_by_closures([pkg])
        assert result == [pkg]

    def test_dependency_order(self):
        pkg1: NixEvalJobsOutput = {
            "attr": "packages.x86_64-linux.lib",
            "attrPath": ["packages", "x86_64-linux", "lib"],
            "cacheStatus": "notBuilt",
            "drvPath": "/nix/store/lib.drv",
            "name": "lib",
            "system": "x86_64-linux",
            "neededBuilds": [],
            "neededSubstitutes": [],
        }
        pkg2: NixEvalJobsOutput = {
            "attr": "packages.x86_64-linux.app",
            "attrPath": ["packages", "x86_64-linux", "app"],
            "cacheStatus": "notBuilt",
            "drvPath": "/nix/store/app.drv",
            "name": "app",
            "system": "x86_64-linux",
            "neededBuilds": ["/nix/store/lib.drv"],
            "neededSubstitutes": [],
        }

        # Regardless of input order, lib should come before app
        result = sort_pkgs_by_closures([pkg2, pkg1])
        assert result == [pkg1, pkg2]

        result = sort_pkgs_by_closures([pkg1, pkg2])
        assert result == [pkg1, pkg2]
