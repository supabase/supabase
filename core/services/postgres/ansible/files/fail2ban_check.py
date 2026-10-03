import subprocess
import sys
import os
import re


# Expected fail2ban configuration
expected_fail2ban_config = {
    "jail": {
        "name": "postgresql",
        "enabled": True,
        "logpath": "/var/log/postgresql/auth-failures.csv",
        "filter": "postgresql",
        "port": "5432",
        "protocol": "tcp",
        "maxretry": 3,
        "ignoreip": ["192.168.0.0/16", "172.17.1.0/20"],
        "backend": "auto",
    },
    "filter": {
        "failregex": r'^.*,.*,.*,.*,"<HOST>:.*password authentication failed for user.*$',
        "ignoreregex": r'^.*,.*,.*,.*,"127\.0\.0\.1.*password authentication failed for user.*$',
        # Additional ignoreregex patterns added by Ansible (setup-fail2ban.yml lines 55-62)
        "custom_ignoreregex": [
            r'^.*,.*,.*,.*,"<HOST>:.*password authentication failed for user ""supabase_admin".*$',
            r'^.*,.*,.*,.*,"<HOST>:.*password authentication failed for user ""supabase_auth_admin".*$',
            r'^.*,.*,.*,.*,"<HOST>:.*password authentication failed for user ""supabase_storage_admin".*$',
            r'^.*,.*,.*,.*,"<HOST>:.*password authentication failed for user ""authenticator".*$',
            r'^.*,.*,.*,.*,"<HOST>:.*password authentication failed for user ""pgbouncer".*$',
        ],
    },
}


def run_command(command):
    """Run a shell command and return the output."""
    try:
        process = subprocess.Popen(
            command,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )
        stdout, stderr = process.communicate()
        return {
            "returncode": process.returncode,
            "stdout": stdout,
            "stderr": stderr,
            "succeeded": process.returncode == 0,
        }
    except Exception as e:
        print(f"Error running command '{command}': {e}")
        sys.exit(1)


def check_fail2ban_config_syntax():
    """Validate fail2ban configuration syntax using fail2ban-client -d."""
    print("Checking fail2ban configuration syntax...")

    result = run_command("fail2ban-client -d")

    if not result["succeeded"]:
        print("fail2ban configuration syntax check failed:")
        print(result["stderr"])
        sys.exit(1)

    # Check that postgresql jail appears in the dump
    if "postgresql" not in result["stdout"]:
        print("postgresql jail not found in fail2ban configuration dump")
        sys.exit(1)

    print("✓ fail2ban configuration syntax is valid")


def check_fail2ban_filter_regex():
    """Test fail2ban filter regex against the log file."""
    print("Testing fail2ban filter regex...")

    logpath = expected_fail2ban_config["jail"]["logpath"]
    filter_path = "/etc/fail2ban/filter.d/postgresql.conf"

    # Check if log file exists
    if not os.path.exists(logpath):
        print(f"Log file {logpath} does not exist")
        print(
            "Note: This is expected if PostgreSQL hasn't run yet. Skipping regex test."
        )
        return

    # Check if filter file exists
    if not os.path.exists(filter_path):
        print(f"Filter file {filter_path} does not exist")
        sys.exit(1)

    # Run fail2ban-regex to test the filter
    result = run_command(f"fail2ban-regex {logpath} {filter_path}")

    if not result["succeeded"]:
        print("fail2ban-regex test failed:")
        print(result["stderr"])
        sys.exit(1)

    print("✓ fail2ban filter regex test passed")


def check_fail2ban_jail_config():
    """Validate jail configuration file contents."""
    print("Checking fail2ban jail configuration...")

    jail_config_path = "/etc/fail2ban/jail.d/postgresql.conf"

    if not os.path.exists(jail_config_path):
        print(f"Jail configuration file {jail_config_path} does not exist")
        sys.exit(1)

    with open(jail_config_path, "r") as f:
        jail_content = f.read()

    expected_jail = expected_fail2ban_config["jail"]

    # Check each expected configuration value
    checks = [
        (f"enabled = {str(expected_jail['enabled']).lower()}", "enabled setting"),
        (f"port    = {expected_jail['port']}", "port setting"),
        (f"protocol = {expected_jail['protocol']}", "protocol setting"),
        (f"filter = {expected_jail['filter']}", "filter setting"),
        (f"logpath = {expected_jail['logpath']}", "logpath setting"),
        (f"maxretry = {expected_jail['maxretry']}", "maxretry setting"),
        (f"backend = {expected_jail['backend']}", "backend setting"),
    ]

    for expected_line, description in checks:
        if expected_line not in jail_content:
            print(f"Missing or incorrect {description} in {jail_config_path}")
            print(f"Expected: {expected_line}")
            sys.exit(1)

    # Check ignoreip
    for ip_range in expected_jail["ignoreip"]:
        if ip_range not in jail_content:
            print(f"Missing ignoreip range {ip_range} in {jail_config_path}")
            sys.exit(1)

    print("✓ fail2ban jail configuration is correct")


def check_fail2ban_filter_config():
    """Validate filter configuration file contents."""
    print("Checking fail2ban filter configuration...")

    filter_config_path = "/etc/fail2ban/filter.d/postgresql.conf"

    if not os.path.exists(filter_config_path):
        print(f"Filter configuration file {filter_config_path} does not exist")
        sys.exit(1)

    with open(filter_config_path, "r") as f:
        filter_content = f.read()

    expected_filter = expected_fail2ban_config["filter"]

    # Check failregex
    if expected_filter["failregex"] not in filter_content:
        print(f"Missing or incorrect failregex in {filter_config_path}")
        print(f"Expected: {expected_filter['failregex']}")
        sys.exit(1)

    # Check ignoreregex
    if expected_filter["ignoreregex"] not in filter_content:
        print(f"Missing or incorrect ignoreregex in {filter_config_path}")
        print(f"Expected: {expected_filter['ignoreregex']}")
        sys.exit(1)

    # Check custom ignoreregex patterns for Supabase users
    for custom_pattern in expected_filter["custom_ignoreregex"]:
        if custom_pattern not in filter_content:
            print(f"Missing custom ignoreregex pattern in {filter_config_path}")
            print(f"Expected: {custom_pattern}")
            sys.exit(1)

    print("✓ fail2ban filter configuration is correct")


def check_fail2ban_jail_runtime():
    """Validate fail2ban jail is running and monitoring the correct file."""
    print("Checking fail2ban jail runtime status...")

    # Run fail2ban-client status postgresql
    result = run_command("fail2ban-client status postgresql")

    if not result["succeeded"]:
        print("Failed to get fail2ban postgresql jail status:")
        print(result["stderr"])
        sys.exit(1)

    output = result["stdout"]

    # Parse the output
    # Expected format:
    # Status for the jail: postgresql
    # |- Filter
    # |  |- Currently failed: 0
    # |  |- Total failed:     X
    # |  `- File list:        /var/log/postgresql/auth-failures.csv

    # Check jail name
    if "Status for the jail: postgresql" not in output:
        print("postgresql jail is not active")
        print(output)
        sys.exit(1)

    # Check file list
    expected_logpath = expected_fail2ban_config["jail"]["logpath"]
    if expected_logpath not in output:
        print(
            f"postgresql jail is not monitoring the expected log file: {expected_logpath}"
        )
        print(output)
        sys.exit(1)

    # Extract and display some stats
    match = re.search(r"Currently failed:\s+(\d+)", output)
    if match:
        currently_failed = match.group(1)
        print(f"  Currently failed IPs: {currently_failed}")

    match = re.search(r"Total failed:\s+(\d+)", output)
    if match:
        total_failed = match.group(1)
        print(f"  Total failed attempts: {total_failed}")

    print("✓ fail2ban postgresql jail is active and monitoring correctly")


def main():
    print("=" * 60)
    print("Supabase Postgres fail2ban Configuration Checker")
    print("=" * 60)

    # Static validation (doesn't require fail2ban to be running)
    check_fail2ban_jail_config()
    check_fail2ban_filter_config()
    check_fail2ban_config_syntax()
    check_fail2ban_filter_regex()

    # Runtime validation (requires fail2ban to be running)
    # This should be called when fail2ban service is started
    check_fail2ban_jail_runtime()

    print("=" * 60)
    print("All fail2ban configuration checks passed!")
    print("=" * 60)


if __name__ == "__main__":
    main()
