#!/usr/bin/env python3

import argparse
from collections import Counter, defaultdict
import graphlib
import json
import os
import subprocess
import sys
from typing import (
    Any,
    Dict,
    List,
    Literal,
    NamedTuple,
    NotRequired,
    Optional,
    Set,
    Tuple,
    TypedDict,
    get_args,
)

from github_action_utils import debug, notice, error, set_output, warning
from result import Err, Ok, Result

System = Literal["x86_64-linux", "aarch64-linux", "aarch64-darwin"]


class NixEvalJobsOutput(TypedDict):
    """Raw output from nix-eval-jobs command."""

    attr: str
    attrPath: List[str]
    cacheStatus: Literal["notBuilt", "cached", "local"]
    drvPath: str
    name: str
    system: System
    neededBuilds: NotRequired[List[Any]]
    neededSubstitutes: NotRequired[List[Any]]
    outputs: NotRequired[Dict[str, str]]
    error: NotRequired[str]
    requiredSystemFeatures: NotRequired[List[str]]


class RunsOnConfig(TypedDict):
    """GitHub Actions runs-on configuration."""

    group: NotRequired[str]
    labels: List[str]


class GitHubActionPackage(TypedDict):
    """Final package output for GitHub Actions matrix."""

    attr: str
    name: str
    system: System
    runs_on: RunsOnConfig
    postgresql_version: NotRequired[str]


class NixEvalError(TypedDict):
    """Error information from nix evaluation."""

    attr: str
    error: str


def build_nix_eval_command(
    max_workers: int, max_memory_size: int, flake_outputs: List[str]
) -> List[str]:
    """Build the nix-eval-jobs command with appropriate flags."""
    nix_eval_cmd = [
        "nix-eval-jobs",
        "--flake",
        ".",
        "--check-cache-status",
        "--force-recurse",
        "--quiet",
        "--option",
        "eval-cache",
        "false",
        "--option",
        "accept-flake-config",
        "true",
        "--max-memory-size",
        str(max_memory_size),
        "--workers",
        str(max_workers),
        "--select",
        f"outputs: {{ inherit (outputs) {' '.join(flake_outputs)}; }}",
    ]
    return nix_eval_cmd


def parse_nix_eval_line(
    line: str, drv_paths: Set[str]
) -> Result[Optional[NixEvalJobsOutput], NixEvalError]:
    """Parse a single line of nix-eval-jobs output.

    Returns:
        Ok(package_data) if successful (None for empty/duplicate lines)
        Err(NixEvalError) if a nix evaluation error occurred
    """
    if not line.strip():
        return Ok(None)

    try:
        data: NixEvalJobsOutput = json.loads(line)
        if "error" in data:
            error_msg = data["error"]

            # Extract the core error message (last "error:" line and following context)
            error_lines = error_msg.split("\n")
            core_error_idx = -1
            for i in range(len(error_lines) - 1, -1, -1):
                if error_lines[i].strip().startswith("error:"):
                    core_error_idx = i
                    break

            if core_error_idx >= 0:
                # Take the last error line and up to 3 lines of context after it
                error_msg = "\n".join(
                    error_lines[
                        core_error_idx : min(core_error_idx + 4, len(error_lines))
                    ]
                ).strip()

            return Err({"attr": data["attr"], "error": error_msg})
        if data["drvPath"] in drv_paths:
            return Ok(None)
        if "nixos-test" in data.get("requiredSystemFeatures", []) and data[
            "system"
        ] in ("aarch64-darwin"):
            return Ok(None)
        drv_paths.add(data["drvPath"])
        return Ok(data)
    except json.JSONDecodeError as e:
        warning(f"Skipping invalid JSON line: {line}", title="JSON Parse Warning")
        return Ok(None)


def run_nix_eval_jobs(
    cmd: List[str],
) -> Tuple[str, List[str]]:
    """Run nix-eval-jobs and return parsed package data, warnings, and errors.

    Returns:
        Tuple of (stdout, warnings_list)
    """
    print(f"Running: {' '.join(cmd)}", file=sys.stderr)

    # Disable colors in nix output
    env = os.environ.copy()
    env["NO_COLOR"] = "1"

    process = subprocess.Popen(
        cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, env=env
    )
    stdout_data, stderr_data = process.communicate()

    # Parse stderr for warnings (lines starting with "warning:")
    warnings_list: List[str] = []
    for line in stderr_data.splitlines():
        line = line.strip()
        if line.startswith("warning:") or line.startswith("evaluation warning:"):
            # Remove "warning:" prefix for cleaner messages
            warnings_list.append(line[8:].strip())

    if process.returncode != 0:
        error(
            "nix-eval-jobs process failed with non-zero exit code",
            title="Process Failure",
        )

    return stdout_data, warnings_list


def process_nix_eval_jobs_stdout(
    stdout: str,
) -> Tuple[List[NixEvalJobsOutput], List[NixEvalError]]:
    # Parse stdout for packages
    packages: List[NixEvalJobsOutput] = []
    drv_paths: Set[str] = set()
    errors: List[NixEvalError] = []
    for line in stdout.splitlines():
        result = parse_nix_eval_line(line, drv_paths)
        if result.is_err():
            errors.append(result._value)
        elif result._value is not None:
            packages.append(result._value)

    return packages, errors


def is_extension_pkg(pkg: NixEvalJobsOutput) -> bool:
    """Check if the package is a postgresql extension package."""
    attrs = pkg["attr"].split(".")
    return attrs[-2] == "exts"


# thank you buildbot-nix https://github.com/nix-community/buildbot-nix/blob/985d069a2a45cf4a571a4346107671adc2bd2a16/buildbot_nix/buildbot_nix/build_trigger.py#L297
def sort_pkgs_by_closures(jobs: List[NixEvalJobsOutput]) -> List[NixEvalJobsOutput]:
    sorted_jobs = []

    # Prepare job dependencies
    job_set = {job["drvPath"] for job in jobs}
    job_closures = {
        k["drvPath"]: set(k.get("neededSubstitutes", []))
        .union(set(k.get("neededBuilds", [])))
        .intersection(job_set)
        .difference({k["drvPath"]})
        for k in jobs
    }

    sorter = graphlib.TopologicalSorter(job_closures)

    job_by_drv = {job["drvPath"]: job for job in jobs}
    for item in sorter.static_order():
        if item in job_by_drv:
            sorted_jobs.append(job_by_drv[item])

    return sorted_jobs


def is_large_pkg(pkg: NixEvalJobsOutput) -> bool:
    """Determine if a package is considered large based on its attribute path."""
    return "big-parallel" in pkg.get("requiredSystemFeatures", [])


def is_virt_pkg(pkg: NixEvalJobsOutput) -> bool:
    """Determine if a package requires hardware virtualization capabilities"""
    return bool({"apple-virt", "kvm"} & set(pkg.get("requiredSystemFeatures", [])))


def get_runner_for_package(pkg: NixEvalJobsOutput) -> RunsOnConfig | None:
    """Determine the appropriate GitHub Actions runner for a package.

    Priority order:
    1. VM packages on Darwin → self-hosted runners
    2. VM packages on Linux  → 16vcpu blacksmith runners
    3. Large packages on D/L → 12/32vcpu blacksmith runners
    5. Default Darwin/Linux  → 6/8vcpu blacksmith runners
    """

    system = pkg["system"]
    arch, os = system.split("-")

    class Specs(NamedTuple):
        vcpu: int = 0
        osv: str = None

    specs = Specs()

    match (is_virt_pkg(pkg), is_large_pkg(pkg), os, arch):
        # kvm
        case (True, _, "darwin", "aarch64"):
            return {"group": "self-hosted-runners-nix", "labels": ["aarch64-darwin"]}
        case (True, _, "linux", "aarch64"):
            return {"labels": ["arm-native-runner"]}
        case (True, _, "linux", "x86_64"):
            specs = Specs(16, "ubuntu-2404")

        # large
        case (_, True, "darwin", "aarch64"):
            specs = Specs(12, "macos-26")
        case (_, True, "linux", "aarch64"):
            specs = Specs(32, "ubuntu-2404-arm")
        case (_, True, "linux", "x86_64"):
            specs = Specs(32, "ubuntu-2404")

        # default
        case (_, _, "darwin", "aarch64"):
            specs = Specs(6, "macos-26")
        case (_, _, "linux", "aarch64"):
            specs = Specs(8, "ubuntu-2404-arm")
        case (_, _, "linux", "x86_64"):
            specs = Specs(8, "ubuntu-2404")

    return {"labels": [f"blacksmith-{specs.vcpu}vcpu-{specs.osv}"]}


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate GitHub Actions matrix for Nix builds"
    )
    parser.add_argument(
        "--max-memory-size",
        default=3072,
        type=int,
        help="Maximum memory per eval worker in MiB. Defaults to 3072 (3 GiB).",
    )
    parser.add_argument(
        "-j",
        "--nb-eval-jobs-workers",
        default=os.cpu_count() or 1,
        type=int,
        help="Number of parallel eval jobs. Defaults to the number of logical CPUs in the system.",
    )
    parser.add_argument(
        "--stdin",
        action="store_true",
        help="Read nix-eval-jobs output from stdin instead of executing process",
    )
    parser.add_argument(
        "--stdout",
        action="store_true",
        help="Send matrix as json to stdout",
    )
    parser.add_argument(
        "flake_outputs", nargs="+", help="Nix flake outputs to evaluate"
    )

    args = parser.parse_args()

    if args.stdin:
        nix_eval_output, warnings_list = sys.stdin.read(), []
    else:
        cmd = build_nix_eval_command(
            args.nb_eval_jobs_workers,
            args.max_memory_size,
            args.flake_outputs,
        )
        nix_eval_output, warnings_list = run_nix_eval_jobs(cmd)

    packages, errors_list = process_nix_eval_jobs_stdout(nix_eval_output)
    gh_action_packages = sort_pkgs_by_closures(packages)

    def clean_package_for_output(pkg: NixEvalJobsOutput) -> GitHubActionPackage:
        """Convert nix-eval-jobs output to GitHub Actions matrix package"""
        runner = get_runner_for_package(pkg)
        if runner is None:
            raise ValueError(f"No runner configuration for system: {pkg['system']}")
        returned_pkg: GitHubActionPackage = {
            "attr": pkg["attr"],
            "name": pkg["name"],
            "system": pkg["system"],
            "runs_on": runner,
        }
        if is_extension_pkg(pkg):
            # Extract PostgreSQL version from attribute path
            attrs = pkg["attr"].split(".")
            returned_pkg["postgresql_version"] = attrs[-3].split("_")[-1]
        return returned_pkg

    # Group packages by system and type (checks vs packages)
    packages_by_system: Dict[System, List[GitHubActionPackage]] = defaultdict(list)
    checks_by_system: Dict[System, List[GitHubActionPackage]] = defaultdict(list)
    for pkg in gh_action_packages:
        if pkg.get("cacheStatus") == "notBuilt":
            cleaned_pkg = clean_package_for_output(pkg)
            if pkg["attr"].startswith("checks."):
                checks_by_system[pkg["system"]].append(cleaned_pkg)
            elif pkg["attr"].startswith("legacyPackages."):
                packages_by_system[pkg["system"]].append(cleaned_pkg)

    packages_output: Dict[str, Dict[str, List[GitHubActionPackage]]] = {}
    for pkg_system, pkg_list in packages_by_system.items():
        packages_output[pkg_system.replace("-", "_")] = {"include": pkg_list}

    checks_output: Dict[str, Dict[str, List[GitHubActionPackage]]] = {}
    for check_system, check_list in checks_by_system.items():
        checks_output[check_system.replace("-", "_")] = {"include": check_list}

    for system in get_args(System):
        s = system.replace("-", "_")
        if s not in checks_output:
            checks_output[s] = {
                "include": [
                    {
                        "attr": "",
                        "name": "no checks to build",
                        "system": system,
                        "runs_on": {"labels": ["ubuntu-latest"]},
                    }
                ]
            }
        if s not in packages_output:
            packages_output[s] = {
                "include": [
                    {
                        "attr": "",
                        "name": "no packages to build",
                        "system": system,
                        "runs_on": {"labels": ["ubuntu-latest"]},
                    }
                ]
            }

    gh_output = {
        "packages": packages_output,
        "checks": checks_output,
    }

    if warnings_list:
        warning_counts = Counter(warnings_list)
        for warn_msg, count in warning_counts.items():
            if count > 1:
                warning(
                    f"{warn_msg} (occurred {count} times)",
                    title="Nix Evaluation Warning",
                )
            else:
                warning(warn_msg, title="Nix Evaluation Warning")

    if errors_list:
        # Group errors by error message
        errors_by_message: Dict[str, List[str]] = defaultdict(list)
        for err in errors_list:
            errors_by_message[err["error"]].append(err["attr"])

        for error_msg, attrs in errors_by_message.items():
            # Format message with attributes on first line, then error details
            if len(attrs) > 1:
                formatted_msg = f"Affected attributes ({len(attrs)}): {', '.join(attrs)}\n\n{error_msg}"
            else:
                formatted_msg = f"Attribute: {attrs[0]}\n\n{error_msg}"
            formatted_msg = formatted_msg.replace("\n", "%0A")
            error(formatted_msg, title="Nix Evaluation Error")

    if errors_list:
        sys.exit(1)
    elif args.stdout:
        print(json.dumps(gh_output))
    else:
        formatted_msg = f"Generated GitHub Actions matrix: {json.dumps(gh_output, indent=2)}".replace(
            "\n", "%0A"
        )
        notice(formatted_msg, title="GitHub Actions Matrix")
        set_output("packages_matrix", json.dumps(gh_output["packages"]))
        set_output("checks_matrix", json.dumps(gh_output["checks"]))


if __name__ == "__main__":
    main()
