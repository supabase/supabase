import sys
import argparse
import os
import stat
import pwd
import grp


# Expected groups for each user
expected_results = {
    "postgres": [
        {"groupname": "postgres", "username": "postgres"},
        {"groupname": "ssl-cert", "username": "postgres"},
    ],
    "ubuntu": [
        {"groupname": "adm", "username": "ubuntu"},
        {"groupname": "audio", "username": "ubuntu"},
        {"groupname": "cdrom", "username": "ubuntu"},
        {"groupname": "dialout", "username": "ubuntu"},
        {"groupname": "dip", "username": "ubuntu"},
        {"groupname": "floppy", "username": "ubuntu"},
        {"groupname": "lxd", "username": "ubuntu"},
        {"groupname": "netdev", "username": "ubuntu"},
        {"groupname": "plugdev", "username": "ubuntu"},
        {"groupname": "sudo", "username": "ubuntu"},
        {"groupname": "ubuntu", "username": "ubuntu"},
        {"groupname": "video", "username": "ubuntu"},
    ],
    "root": [{"groupname": "root", "username": "root"}],
    "daemon": [{"groupname": "daemon", "username": "daemon"}],
    "bin": [{"groupname": "bin", "username": "bin"}],
    "sys": [{"groupname": "sys", "username": "sys"}],
    "sync": [{"groupname": "nogroup", "username": "sync"}],
    "games": [{"groupname": "games", "username": "games"}],
    "man": [{"groupname": "man", "username": "man"}],
    "lp": [{"groupname": "lp", "username": "lp"}],
    "mail": [{"groupname": "mail", "username": "mail"}],
    "news": [{"groupname": "news", "username": "news"}],
    "uucp": [{"groupname": "uucp", "username": "uucp"}],
    "proxy": [{"groupname": "proxy", "username": "proxy"}],
    "www-data": [{"groupname": "www-data", "username": "www-data"}],
    "backup": [{"groupname": "backup", "username": "backup"}],
    "list": [{"groupname": "list", "username": "list"}],
    "irc": [{"groupname": "irc", "username": "irc"}],
    "nobody": [{"groupname": "nogroup", "username": "nobody"}],
    "systemd-network": [
        {"groupname": "systemd-network", "username": "systemd-network"}
    ],
    "systemd-resolve": [
        {"groupname": "systemd-resolve", "username": "systemd-resolve"}
    ],
    "systemd-timesync": [
        {"groupname": "systemd-timesync", "username": "systemd-timesync"}
    ],
    "messagebus": [{"groupname": "messagebus", "username": "messagebus"}],
    "ec2-instance-connect": [
        {"groupname": "nogroup", "username": "ec2-instance-connect"}
    ],
    "sshd": [{"groupname": "nogroup", "username": "sshd"}],
    "wal-g": [
        {"groupname": "postgres", "username": "wal-g"},
        {"groupname": "wal-g", "username": "wal-g"},
    ],
    "pgbouncer": [
        {"groupname": "pgbouncer", "username": "pgbouncer"},
        {"groupname": "postgres", "username": "pgbouncer"},
        {"groupname": "ssl-cert", "username": "pgbouncer"},
    ],
    "gotrue": [{"groupname": "gotrue", "username": "gotrue"}],
    "envoy": [{"groupname": "envoy", "username": "envoy"}],
    "kong": [{"groupname": "kong", "username": "kong"}],
    "vector": [
        {"groupname": "adm", "username": "vector"},
        {"groupname": "postgres", "username": "vector"},
        {"groupname": "systemd-journal", "username": "vector"},
        {"groupname": "vector", "username": "vector"},
    ],
    "adminapi": [
        {"groupname": "admin", "username": "adminapi"},
        {"groupname": "adminapi", "username": "adminapi"},
        {"groupname": "envoy", "username": "adminapi"},
        {"groupname": "gotrue", "username": "adminapi"},
        {"groupname": "kong", "username": "adminapi"},
        {"groupname": "pgbouncer", "username": "adminapi"},
        {"groupname": "postgres", "username": "adminapi"},
        {"groupname": "postgrest", "username": "adminapi"},
        {"groupname": "root", "username": "adminapi"},
        {"groupname": "systemd-journal", "username": "adminapi"},
        {"groupname": "vector", "username": "adminapi"},
        {"groupname": "wal-g", "username": "adminapi"},
    ],
    "postgrest": [{"groupname": "postgrest", "username": "postgrest"}],
    "tcpdump": [{"groupname": "tcpdump", "username": "tcpdump"}],
    "systemd-coredump": [
        {"groupname": "systemd-coredump", "username": "systemd-coredump"}
    ],
    "supabase-admin-agent": [
        {"groupname": "supabase-admin-agent", "username": "supabase-admin-agent"},
        {"groupname": "admin", "username": "supabase-admin-agent"},
        {"groupname": "salt", "username": "supabase-admin-agent"},
    ],
}

# postgresql.service is expected to mount /etc as read-only
expected_mount = "/etc ro"

# Expected directory permissions for security-critical paths
# Format: path -> (expected_mode, expected_owner, expected_group, description)
expected_directory_permissions = {
    "/var/lib/postgresql": (
        "0755",
        "postgres",
        "postgres",
        "PostgreSQL home - must be traversable for nix-profile symlinks",
    ),
    "/var/lib/postgresql/data": (
        "0750",
        "postgres",
        "postgres",
        "PostgreSQL data directory symlink - secure, postgres only",
    ),
    "/data/pgdata": (
        "0750",
        "postgres",
        "postgres",
        "Actual PostgreSQL data directory - secure, postgres only",
    ),
    "/etc/postgresql": (
        "0775",
        "postgres",
        "postgres",
        "PostgreSQL configuration directory - adminapi writable",
    ),
    "/etc/postgresql-custom": (
        "0775",
        "postgres",
        "postgres",
        "PostgreSQL custom configuration - adminapi writable",
    ),
    "/etc/ssl/private": (
        "0750",
        "root",
        "ssl-cert",
        "SSL private keys directory - secure, ssl-cert group only",
    ),
    "/home/postgres": (
        "0750",
        "postgres",
        "postgres",
        "postgres user home directory - secure, postgres only",
    ),
    "/var/log/postgresql": (
        "0750",
        "postgres",
        "postgres",
        "PostgreSQL logs directory - secure, postgres only",
    ),
}


def get_user_groups(username):
    """Get all groups that a user belongs to using Python's pwd and grp modules."""
    try:
        user_info = pwd.getpwnam(username)
        user_uid = user_info.pw_uid
        user_gid = user_info.pw_gid

        # Get all groups
        groups = []
        for group in grp.getgrall():
            # Check if user is in the group (either as primary group or in member list)
            if user_gid == group.gr_gid or username in group.gr_mem:
                groups.append({"username": username, "groupname": group.gr_name})

        # Sort by groupname to match expected behavior
        groups.sort(key=lambda x: x["groupname"])
        return groups
    except KeyError:
        print(f"User '{username}' not found")
        sys.exit(1)


def compare_results(username, query_result):
    expected_result = expected_results.get(username)
    if expected_result is None:
        print(f"No expected result defined for user '{username}'")
        sys.exit(1)

    if query_result == expected_result:
        print(f"The query result for user '{username}' matches the expected result.")
    else:
        print(
            f"The query result for user '{username}' does not match the expected result."
        )
        print("Expected:", expected_result)
        print("Got:", query_result)
        sys.exit(1)


def check_nixbld_users():
    """Check that all nixbld users are only in the nixbld group."""
    # Get all users that match the pattern nixbld*
    nixbld_users = []
    for user in pwd.getpwall():
        if user.pw_name.startswith("nixbld"):
            nixbld_users.append(user.pw_name)

    if not nixbld_users:
        print("No nixbld users found")
        return

    # Check each nixbld user's groups
    for username in nixbld_users:
        groups = get_user_groups(username)
        for user_group in groups:
            if user_group["groupname"] != "nixbld":
                print(
                    f"User '{username}' is in group '{user_group['groupname']}' instead of 'nixbld'."
                )
                sys.exit(1)

    print("All nixbld users are in the 'nixbld' group.")


def check_postgresql_mount():
    """Check that postgresql.service mounts /etc as read-only."""
    # Find the postgres process by reading /proc
    # We're looking for a process with .postgres-wrapped in the path
    # and -D /etc/postgresql in the command line
    pid = None

    for proc_dir in os.listdir("/proc"):
        if not proc_dir.isdigit():
            continue

        try:
            # Read the command line
            with open(f"/proc/{proc_dir}/cmdline", "r") as f:
                cmdline = f.read()
                # Check if this is a postgres process with the right data directory
                if ".postgres-wrapped" in cmdline and "-D /etc/postgresql" in cmdline:
                    pid = proc_dir
                    break
        except (FileNotFoundError, PermissionError):
            # Process might have disappeared or we don't have permission
            continue

    if pid is None:
        print(
            "Could not find postgres process with .postgres-wrapped and -D /etc/postgresql"
        )
        sys.exit(1)

    # Get the mounts for the process
    with open(f"/proc/{pid}/mounts", "r") as o:
        lines = [line for line in o if "/etc" in line and "ro," in line]
        if len(lines) == 0:
            print(f"Expected exactly 1 match, got 0")
            sys.exit(1)
        if len(lines) != 1:
            print(f"Expected exactly 1 match, got {len(lines)}: {';'.join(lines)}")
            sys.exit(1)

    print("postgresql.service mounts /etc as read-only.")


def check_directory_permissions():
    """Check that security-critical directories have the correct permissions."""
    errors = []

    for path, (
        expected_mode,
        expected_owner,
        expected_group,
        description,
    ) in expected_directory_permissions.items():
        # Skip if path doesn't exist (might be a symlink or not created yet)
        if not os.path.exists(path):
            print(f"Warning: {path} does not exist, skipping permission check")
            continue

        # Get actual permissions
        try:
            stat_info = os.stat(path)
            actual_mode = oct(stat.S_IMODE(stat_info.st_mode))[2:]  # Remove '0o' prefix

            # Get owner and group names
            actual_owner = pwd.getpwuid(stat_info.st_uid).pw_name
            actual_group = grp.getgrgid(stat_info.st_gid).gr_name

            # Check permissions
            if actual_mode != expected_mode:
                errors.append(
                    f"ERROR: {path} has mode {actual_mode}, expected {expected_mode}\n"
                    f"  Description: {description}\n"
                    f"  Fix: sudo chmod {expected_mode} {path}"
                )

            # Check ownership
            if actual_owner != expected_owner:
                errors.append(
                    f"ERROR: {path} has owner {actual_owner}, expected {expected_owner}\n"
                    f"  Description: {description}\n"
                    f"  Fix: sudo chown {expected_owner}:{actual_group} {path}"
                )

            # Check group
            if actual_group != expected_group:
                errors.append(
                    f"ERROR: {path} has group {actual_group}, expected {expected_group}\n"
                    f"  Description: {description}\n"
                    f"  Fix: sudo chown {actual_owner}:{expected_group} {path}"
                )

            if not errors or not any(path in err for err in errors):
                print(f"✓ {path}: {actual_mode} {actual_owner}:{actual_group} - OK")

        except Exception as e:
            errors.append(f"ERROR: Failed to check {path}: {str(e)}")

    if errors:
        print("\n" + "=" * 80)
        print("DIRECTORY PERMISSION ERRORS DETECTED:")
        print("=" * 80)
        for error in errors:
            print(error)
        print("=" * 80)
        sys.exit(1)

    print("\nAll directory permissions are correct.")


def main():
    parser = argparse.ArgumentParser(
        prog="Supabase Postgres Artifact Permissions Checker",
        description="Checks the Postgres Artifact for the appropriate users and group memberships",
    )
    parser.add_argument(
        "-q",
        "--qemu",
        action="store_true",
        help="Whether we are checking a QEMU artifact",
    )
    args = parser.parse_args()
    qemu_artifact = args.qemu or False

    # Define usernames for which you want to compare results
    usernames = [
        "postgres",
        "ubuntu",
        "root",
        "daemon",
        "bin",
        "sys",
        "sync",
        "games",
        "man",
        "lp",
        "mail",
        "news",
        "uucp",
        "proxy",
        "www-data",
        "backup",
        "list",
        "irc",
        "nobody",
        "systemd-network",
        "systemd-resolve",
        "systemd-timesync",
        "messagebus",
        "sshd",
        "wal-g",
        "pgbouncer",
        "gotrue",
        "envoy",
        "kong",
        "vector",
        "adminapi",
        "postgrest",
        "tcpdump",
        "systemd-coredump",
        "supabase-admin-agent",
    ]
    if not qemu_artifact:
        usernames.append("ec2-instance-connect")

    # Iterate over usernames, get their groups, and compare results
    for username in usernames:
        user_groups = get_user_groups(username)
        compare_results(username, user_groups)

    # Check if all nixbld users are in the nixbld group
    check_nixbld_users()

    # Check if postgresql.service is using a read-only mount for /etc
    check_postgresql_mount()

    # Check directory permissions for security-critical paths
    check_directory_permissions()


if __name__ == "__main__":
    main()
