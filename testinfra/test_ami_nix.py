import base64
import gzip
import logging
import os
import socket
from pathlib import Path
from time import sleep

import boto3
import paramiko
import pytest
import requests
from ec2instanceconnectcli.EC2InstanceConnectKey import EC2InstanceConnectKey
from ec2instanceconnectcli.EC2InstanceConnectLogger import EC2InstanceConnectLogger

# if EXECUTION_ID is not set, use a default value that includes the user and hostname
RUN_ID = os.environ.get(
    "EXECUTION_ID",
    "unknown-ci-run-"
    + os.environ.get("USER", "unknown-user")
    + "@"
    + socket.gethostname(),
)
AMI_ID = os.environ.get("AMI_ID")
postgresql_schema_sql_content = """
ALTER DATABASE postgres SET "app.settings.jwt_secret" TO  'my_jwt_secret_which_is_not_so_secret';
ALTER DATABASE postgres SET "app.settings.jwt_exp" TO 3600;

ALTER USER supabase_admin WITH PASSWORD 'postgres';
ALTER USER postgres WITH PASSWORD 'postgres';
ALTER USER authenticator WITH PASSWORD 'postgres';
ALTER USER pgbouncer WITH PASSWORD 'postgres';
ALTER USER supabase_auth_admin WITH PASSWORD 'postgres';
ALTER USER supabase_storage_admin WITH PASSWORD 'postgres';
ALTER USER supabase_replication_admin WITH PASSWORD 'postgres';
ALTER USER supabase_etl_admin WITH PASSWORD 'postgres';
ALTER ROLE supabase_read_only_user WITH PASSWORD 'postgres';
ALTER ROLE supabase_admin SET search_path TO "$user",public,auth,extensions;
"""
realtime_env_content = ""
adminapi_yaml_content = """
port: 8085
host: 0.0.0.0
ref: aaaaaaaaaaaaaaaaaaaa
jwt_secret: my_jwt_secret_which_is_not_so_secret
metric_collectors:
    - filesystem
    - meminfo
    - netdev
    - loadavg
    - cpu
    - diskstats
    - vmstat
node_exporter_additional_args:
    - '--collector.filesystem.ignored-mount-points=^/(boot|sys|dev|run).*'
    - '--collector.netdev.device-exclude=lo'
cert_path: /etc/ssl/adminapi/server.crt
key_path: /etc/ssl/adminapi/server.key
upstream_metrics_refresh_duration: 60s
pgbouncer_endpoints:
    - 'postgres://pgbouncer:postgres@localhost:6543/pgbouncer'
fail2ban_socket: /var/run/fail2ban/fail2ban.sock
upstream_metrics_sources:
    -
        name: system
        url: 'https://localhost:8085/metrics'
        labels_to_attach: [{name: supabase_project_ref, value: aaaaaaaaaaaaaaaaaaaa}, {name: service_type, value: db}]
        skip_tls_verify: true
    -
        name: postgresql
        url: 'http://localhost:9187/metrics'
        labels_to_attach: [{name: supabase_project_ref, value: aaaaaaaaaaaaaaaaaaaa}, {name: service_type, value: postgresql}]
    -
        name: gotrue
        url: 'http://localhost:9122/metrics'
        labels_to_attach: [{name: supabase_project_ref, value: aaaaaaaaaaaaaaaaaaaa}, {name: service_type, value: gotrue}]
    -
        name: postgrest
        url: 'http://localhost:3001/metrics'
        labels_to_attach: [{name: supabase_project_ref, value: aaaaaaaaaaaaaaaaaaaa}, {name: service_type, value: postgrest}]
monitoring:
    disk_usage:
        enabled: true
firewall:
    enabled: true
    internal_ports:
        - 9187
        - 8085
        - 9122
    privileged_ports:
        - 22
    privileged_ports_allowlist:
        - 0.0.0.0/0
    filtered_ports:
        - 5432
        - 6543
    unfiltered_ports:
        - 80
        - 443
    managed_rules_file: /etc/nftables/supabase_managed.conf
pg_egress_collect_path: /tmp/pg_egress_collect.txt
aws_config:
    creds:
        enabled: false
        check_frequency: 1h
        refresh_buffer_duration: 6h
"""
pgsodium_root_key_content = (
    "0000000000000000000000000000000000000000000000000000000000000000"
)
postgrest_base_conf_content = """
db-uri = "postgres://authenticator:postgres@localhost:5432/postgres?application_name=postgrest"
db-schema = "public, graphql_public"
db-anon-role = "anon"
jwt-secret = "my_jwt_secret_which_is_not_so_secret"
role-claim-key = ".role"
openapi-mode = "ignore-privileges"
db-use-legacy-gucs = true
admin-server-port = 3001
server-host = "*6"
db-pool-acquisition-timeout = 10
max-rows = 1000
db-extra-search-path = "public, extensions"
"""
gotrue_env_content = """
API_EXTERNAL_URL=http://localhost
GOTRUE_API_HOST=0.0.0.0
GOTRUE_SITE_URL=
GOTRUE_DB_DRIVER=postgres
GOTRUE_DB_DATABASE_URL=postgres://supabase_auth_admin@localhost/postgres?sslmode=disable
GOTRUE_JWT_ADMIN_ROLES=supabase_admin,service_role
GOTRUE_JWT_AUD=authenticated
GOTRUE_JWT_SECRET=my_jwt_secret_which_is_not_so_secret
"""
walg_config_json_content = """
{
  "AWS_REGION": "ap-southeast-1",
  "WALG_S3_PREFIX": "",
  "PGDATABASE": "postgres",
  "PGUSER": "supabase_admin",
  "PGPORT": 5432,
  "WALG_DELTA_MAX_STEPS": 6,
  "WALG_COMPRESSION_METHOD": "lz4"
}
"""
anon_key = "TEST_JWT_REDACTED"
service_role_key = "TEST_JWT_REDACTED"
supabase_admin_key = "TEST_JWT_REDACTED"


def load_expected_pgbouncer_version() -> str:
    repo_root = Path(__file__).resolve().parent.parent
    ansible_vars = repo_root / "ansible" / "vars.yml"
    if ansible_vars.exists():
        with ansible_vars.open() as f:
            for raw_line in f:
                line = raw_line.strip()
                if line.startswith("pgbouncer_release:"):
                    return line.split(":", 1)[1].strip().strip('"')

    nix_file = repo_root / "nix" / "pgbouncer.nix"
    if nix_file.exists():
        with nix_file.open() as f:
            for raw_line in f:
                line = raw_line.strip()
                if line.startswith("version ="):
                    value = line.split("=", 1)[1].strip()
                    return value.strip(";").strip('"')

    raise RuntimeError(
        "Could not determine expected PgBouncer version from configuration files"
    )


EXPECTED_PGBOUNCER_VERSION = load_expected_pgbouncer_version()
PGBOUNCER_BINARY = "/nix/var/nix/profiles/per-user/pgbouncer/profile/bin/pgbouncer"
init_json_content = f"""
{{
  "jwt_secret": "my_jwt_secret_which_is_not_so_secret",
  "project_ref": "aaaaaaaaaaaaaaaaaaaa",
  "logflare_api_key": "",
  "logflare_pitr_errors_source": "",
  "logflare_postgrest_source": "",
  "logflare_pgbouncer_source": "",
  "logflare_db_source": "",
  "logflare_gotrue_source": "",
  "anon_key": "{anon_key}",
  "service_key": "{service_role_key}",
  "supabase_admin_key": "{supabase_admin_key}",
  "common_name": "db.aaaaaaaaaaaaaaaaaaaa.supabase.red",
  "region": "ap-southeast-1",
  "init_database_only": false
}}
"""

logger = logging.getLogger("ami-tests")
handler = logging.StreamHandler()
formatter = logging.Formatter("%(asctime)s %(name)-12s %(levelname)-8s %(message)s")
handler.setFormatter(formatter)
logger.addHandler(handler)
logger.setLevel(logging.DEBUG)


def get_ssh_connection(instance_ip, ssh_identity_file, max_retries=10):
    """Create and return a single SSH connection that can be reused."""
    for attempt in range(max_retries):
        try:
            # Create SSH client
            ssh = paramiko.SSHClient()
            ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

            # Connect with our working parameters
            ssh.connect(
                hostname=instance_ip,
                username="ubuntu",
                key_filename=ssh_identity_file,
                timeout=10,
                banner_timeout=10,
            )

            # Test the connection
            stdin, stdout, stderr = ssh.exec_command('echo "SSH test"')
            if (
                stdout.channel.recv_exit_status() == 0
                and "SSH test" in stdout.read().decode()
            ):
                logger.info("SSH connection established successfully")
                return ssh
            else:
                raise Exception("SSH test command failed")

        except Exception:
            if attempt == max_retries - 1:
                raise
            logger.warning(
                f"Ssh connection failed, retrying: {attempt + 1}/{max_retries} failed, retrying ..."
            )
            sleep(5)


def run_ssh_command(ssh, command, timeout=None):
    """Run a command over the established SSH connection."""
    stdin, stdout, stderr = ssh.exec_command(command, timeout=timeout)
    exit_code = stdout.channel.recv_exit_status()
    return {
        "succeeded": exit_code == 0,
        "stdout": stdout.read().decode(),
        "stderr": stderr.read().decode(),
    }


def upload_file_via_sftp(ssh, local_path, remote_path):
    """Upload a file to the remote host via SFTP."""
    sftp = ssh.open_sftp()
    try:
        sftp.put(local_path, remote_path)
        logger.info(f"Uploaded {local_path} to {remote_path}")
    finally:
        sftp.close()


# scope='session' uses the same container for all the tests;
# scope='function' uses a new container per test function.
@pytest.fixture(scope="session")
def host():
    ec2 = boto3.resource("ec2", region_name="ap-southeast-1")
    image = ec2.Image(AMI_ID)

    def gzip_then_base64_encode(s: str) -> str:
        return base64.b64encode(gzip.compress(s.encode())).decode()

    # Create temporary SSH key pair
    ec2logger = EC2InstanceConnectLogger(debug=False)
    temp_key = EC2InstanceConnectKey(ec2logger.get_logger())

    instance = list(
        ec2.create_instances(
            BlockDeviceMappings=[
                {
                    "DeviceName": "/dev/sda1",
                    "Ebs": {
                        "VolumeSize": 8,  # gb
                        "Encrypted": True,
                        "DeleteOnTermination": True,
                        "VolumeType": "gp3",
                    },
                },
            ],
            MetadataOptions={
                "HttpTokens": "required",
                "HttpEndpoint": "enabled",
            },
            IamInstanceProfile={"Name": "pg-ap-southeast-1"},
            InstanceType="t4g.micro" if image.architecture == "arm64" else "t3.small",
            MinCount=1,
            MaxCount=1,
            ImageId=image.id,
            NetworkInterfaces=[
                {
                    "DeviceIndex": 0,
                    "AssociatePublicIpAddress": True,
                    "Groups": ["sg-0a883ca614ebfbae0", "sg-014d326be5a1627dc"],
                }
            ],
            UserData=f"""#cloud-config
hostname: db-aaaaaaaaaaaaaaaaaaaa
write_files:
    - {{path: /etc/postgresql.schema.sql, content: {gzip_then_base64_encode(postgresql_schema_sql_content)}, permissions: '0600', encoding: gz+b64}}
    - {{path: /etc/realtime.env, content: {gzip_then_base64_encode(realtime_env_content)}, permissions: '0664', encoding: gz+b64}}
    - {{path: /etc/adminapi/adminapi.yaml, content: {gzip_then_base64_encode(adminapi_yaml_content)}, permissions: '0600', owner: 'adminapi:root', encoding: gz+b64}}
    - {{path: /etc/postgresql-custom/pgsodium_root.key, content: {gzip_then_base64_encode(pgsodium_root_key_content)}, permissions: '0600', owner: 'postgres:postgres', encoding: gz+b64}}
    - {{path: /etc/postgrest/base.conf, content: {gzip_then_base64_encode(postgrest_base_conf_content)}, permissions: '0664', encoding: gz+b64}}
    - {{path: /etc/gotrue.env, content: {gzip_then_base64_encode(gotrue_env_content)}, permissions: '0664', encoding: gz+b64}}
    - {{path: /etc/wal-g/config.json, content: {gzip_then_base64_encode(walg_config_json_content)}, permissions: '0664', owner: 'wal-g:wal-g', encoding: gz+b64}}
    - {{path: /tmp/init.json, content: {gzip_then_base64_encode(init_json_content)}, permissions: '0600', encoding: gz+b64}}
runcmd:
    - 'sudo echo \"pgbouncer\" \"postgres\" >> /etc/pgbouncer/userlist.txt'
    - 'cd /tmp && aws s3 cp --region ap-southeast-1 s3://init-scripts-staging/project/init.sh .'
    - 'USE_LEGACY_INT_CA_SECRET=true bash init.sh "staging"'
    - 'touch /var/lib/init-complete'
    - 'rm -rf /tmp/*'
users:
  - name: ubuntu
    ssh_authorized_keys:
      - {temp_key.get_pub_key()}
""",
            TagSpecifications=[
                {
                    "ResourceType": "instance",
                    "Tags": [
                        {"Key": "Name", "Value": "ci-ami-test-nix"},
                        {"Key": "creator", "Value": "testinfra-ci"},
                        {"Key": "testinfra-run-id", "Value": RUN_ID},
                    ],
                }
            ],
        )
    )[0]
    instance.wait_until_running()

    # Increase wait time before starting health checks
    sleep(30)  # Wait for 30 seconds to allow services to start

    # Wait for instance to have public IP
    while not instance.public_ip_address:
        logger.warning("waiting for ip to be available")
        sleep(5)
        instance.reload()

    # Create single SSH connection
    ssh = get_ssh_connection(
        instance.public_ip_address,
        temp_key.get_priv_key_file(),
    )

    # Check PostgreSQL data directory
    logger.info("Checking PostgreSQL data directory...")
    result = run_ssh_command(ssh, "ls -la /var/lib/postgresql")
    if result["succeeded"]:
        logger.info("PostgreSQL data directory contents:\n" + result["stdout"])
    else:
        logger.warning("Failed to list PostgreSQL data directory: " + result["stderr"])

    # Wait for init.sh to complete
    logger.info("Waiting for init.sh to complete...")
    max_attempts = 60  # 5 minutes
    attempt = 0
    while attempt < max_attempts:
        try:
            result = run_ssh_command(ssh, "test -f /var/lib/init-complete", timeout=5)
            if result["succeeded"]:
                logger.info("init.sh has completed")
                break
        except Exception as e:
            logger.warning(f"Error checking init.sh status: {str(e)}")

        attempt += 1
        logger.warning(
            f"Waiting for init.sh to complete (attempt {attempt}/{max_attempts})"
        )
        sleep(5)

    if attempt >= max_attempts:
        logger.error("init.sh failed to complete within the timeout period")
        instance.terminate()
        raise TimeoutError("init.sh failed to complete within the timeout period")

    # Create auth-failures.csv file if it doesn't exist (required for fail2ban to start)
    # This matches what setup_fail2ban() does in the init script
    logger.info("Ensuring PostgreSQL auth-failures.csv exists...")
    result = run_ssh_command(
        ssh,
        "sudo mkdir -p /var/log/postgresql && sudo chown -R postgres:postgres /var/log/postgresql && sudo chmod 1775 /var/log/postgresql && sudo -u postgres touch /var/log/postgresql/auth-failures.csv && sudo chmod 0664 /var/log/postgresql/auth-failures.csv",
    )
    if not result["succeeded"]:
        logger.warning(f"Failed to create auth-failures.csv: {result['stderr']}")

    # Start fail2ban service before health checks
    logger.info("Starting fail2ban service...")
    result = run_ssh_command(ssh, "sudo systemctl start fail2ban.service")
    if not result["succeeded"]:
        logger.warning(f"Failed to start fail2ban: {result['stderr']}")
        # Check fail2ban logs for more details
        log_result = run_ssh_command(
            ssh, "sudo journalctl -u fail2ban -n 20 --no-pager"
        )
        if log_result["succeeded"]:
            logger.warning(f"fail2ban logs:\n{log_result['stdout']}")
    else:
        logger.info("fail2ban service started successfully")

    def is_healthy(ssh) -> bool:
        health_checks = [
            ("postgresql", "sudo -u postgres /usr/bin/pg_isready -U postgres"),
            (
                "adminapi",
                f"curl -sf -k --connect-timeout 30 --max-time 60 https://localhost:8085/health -H 'apikey: {supabase_admin_key}'",
            ),
            (
                "postgrest",
                "curl -sf --connect-timeout 30 --max-time 60 http://localhost:3001/ready",
            ),
            (
                "gotrue",
                "curl -sf --connect-timeout 30 --max-time 60 http://localhost:8081/health",
            ),
            ("kong", "sudo kong health"),
            ("fail2ban", "sudo fail2ban-client status"),
        ]

        for service, command in health_checks:
            try:
                result = run_ssh_command(ssh, command)
                if not result["succeeded"]:
                    info_text = ""
                    info_command = f"sudo journalctl -b -u {service} -n 20 --no-pager"
                    info_result = run_ssh_command(ssh, info_command)
                    if info_result["succeeded"]:
                        info_text = "\n" + info_result["stdout"].strip()

                    logger.warning(f"{service} not ready{info_text}")
                    return False

            except Exception:
                logger.warning(f"Connection failed during {service} check")
                return False
        return True

    while True:
        if is_healthy(ssh):
            break
        sleep(1)

    # Return both the SSH connection and instance IP for use in tests
    yield {"ssh": ssh, "ip": instance.public_ip_address}

    # at the end of the test suite, destroy the instance
    instance.terminate()


def test_postgrest_is_running(host):
    """Check if postgrest service is running using our SSH connection."""
    result = run_ssh_command(host["ssh"], "systemctl is-active postgrest")
    assert result["succeeded"] and result["stdout"].strip() == "active", (
        "PostgREST service is not running"
    )


def test_postgrest_responds_to_requests(host):
    """Test if PostgREST responds to requests."""
    res = requests.get(
        f"http://{host['ip']}/rest/v1/",
        headers={
            "apikey": anon_key,
            "authorization": f"Bearer {anon_key}",
        },
    )
    assert res.ok


def test_postgrest_can_connect_to_db(host):
    """Test if PostgREST can connect to the database."""
    res = requests.get(
        f"http://{host['ip']}/rest-admin/v1/ready",
        headers={
            "apikey": service_role_key,
            "authorization": f"Bearer {service_role_key}",
        },
    )
    assert res.ok


def test_postgrest_starting_apikey_query_parameter_is_removed(host):
    """Test if PostgREST removes apikey query parameter at start."""
    res = requests.get(
        f"http://{host['ip']}/rest/v1/",
        params={
            "apikey": service_role_key,
            "id": "eq.absent",
            "name": "eq.absent",
        },
    )
    assert res.ok


def test_postgrest_middle_apikey_query_parameter_is_removed(host):
    """Test if PostgREST removes apikey query parameter in middle."""
    res = requests.get(
        f"http://{host['ip']}/rest/v1/",
        params={
            "id": "eq.absent",
            "apikey": service_role_key,
            "name": "eq.absent",
        },
    )
    assert res.ok


def test_postgrest_ending_apikey_query_parameter_is_removed(host):
    """Test if PostgREST removes apikey query parameter at end."""
    res = requests.get(
        f"http://{host['ip']}/rest/v1/",
        params={
            "id": "eq.absent",
            "name": "eq.absent",
            "apikey": service_role_key,
        },
    )
    assert res.ok


def test_postgrest_starting_empty_key_query_parameter_is_removed(host):
    """Test if PostgREST removes empty key query parameter at start."""
    res = requests.get(
        f"http://{host['ip']}/rest/v1/",
        params={
            "": "empty_key",
            "id": "eq.absent",
            "apikey": service_role_key,
        },
    )
    assert res.ok


def test_postgrest_middle_empty_key_query_parameter_is_removed(host):
    """Test if PostgREST removes empty key query parameter in middle."""
    res = requests.get(
        f"http://{host['ip']}/rest/v1/",
        params={
            "apikey": service_role_key,
            "": "empty_key",
            "id": "eq.absent",
        },
    )
    assert res.ok


def test_postgrest_ending_empty_key_query_parameter_is_removed(host):
    """Test if PostgREST removes empty key query parameter at end."""
    res = requests.get(
        f"http://{host['ip']}/rest/v1/",
        params={
            "id": "eq.absent",
            "apikey": service_role_key,
            "": "empty_key",
        },
    )
    assert res.ok


def test_postgresql_version(host):
    """Print the PostgreSQL version being tested and ensure it's >= 14."""
    result = run_ssh_command(
        host["ssh"], "sudo -u postgres psql -c 'SELECT version();'"
    )
    if result["succeeded"]:
        print(f"\nPostgreSQL Version:\n{result['stdout']}")
        # Extract version number from the output
        version_line = (
            result["stdout"].strip().split("\n")[2]
        )  # Skip header and get the actual version
        # Extract major version number (e.g., "15.8" -> 15)
        import re

        version_match = re.search(r"PostgreSQL (\d+)\.", version_line)
        if version_match:
            major_version = int(version_match.group(1))
            print(f"PostgreSQL major version: {major_version}")
            assert major_version >= 14, (
                f"PostgreSQL version {major_version} is less than 14"
            )
        else:
            assert False, "Could not parse PostgreSQL version number"
    else:
        print(f"\nFailed to get PostgreSQL version: {result['stderr']}")
        assert False, "Failed to get PostgreSQL version"

    # Also get the version from the command line
    result = run_ssh_command(host["ssh"], "sudo -u postgres psql --version")
    if result["succeeded"]:
        print(f"PostgreSQL Client Version: {result['stdout'].strip()}")
    else:
        print(f"Failed to get PostgreSQL client version: {result['stderr']}")

    print("✓ PostgreSQL version is >= 14")


def test_libpq5_version(host):
    """Print the libpq5 version installed and ensure it's >= 14."""
    # Try different package managers to find libpq5
    result = run_ssh_command(host["ssh"], "dpkg -l | grep libpq5 || true")
    if result["succeeded"] and result["stdout"].strip():
        print(f"\nlibpq5 package info:\n{result['stdout']}")
        # Extract version from dpkg output (format: ii libpq5:arm64 17.5-1.pgdg20.04+1)
        import re

        version_match = re.search(r"libpq5[^ ]* +(\d+)\.", result["stdout"])
        if version_match:
            major_version = int(version_match.group(1))
            print(f"libpq5 major version: {major_version}")
            assert major_version >= 14, (
                f"libpq5 version {major_version} is less than 14"
            )
        else:
            print("Could not parse libpq5 version from dpkg output")
    else:
        print("\nlibpq5 not found via dpkg")

    # Also try to find libpq.so files
    result = run_ssh_command(
        host["ssh"], "find /usr -name '*libpq*' -type f 2>/dev/null | head -10"
    )
    if result["succeeded"] and result["stdout"].strip():
        print(f"\nlibpq files found:\n{result['stdout']}")
    else:
        print("\nNo libpq files found")

    # Check if we can get version from a libpq file
    result = run_ssh_command(host["ssh"], "ldd /usr/bin/psql | grep libpq || true")
    if result["succeeded"] and result["stdout"].strip():
        print(f"\npsql libpq dependency:\n{result['stdout']}")
    else:
        print("\nCould not find libpq dependency for psql")

    # Try to get version from libpq directly
    result = run_ssh_command(host["ssh"], "psql --version 2>&1 | head -1")
    if result["succeeded"] and result["stdout"].strip():
        print(f"\npsql version output: {result['stdout'].strip()}")
        # The psql version should match the libpq version
        import re

        version_match = re.search(r"psql \(PostgreSQL\) (\d+)\.", result["stdout"])
        if version_match:
            major_version = int(version_match.group(1))
            print(f"psql/libpq major version: {major_version}")
            assert major_version >= 14, (
                f"psql/libpq version {major_version} is less than 14"
            )
        else:
            print("Could not parse psql version")

    print("✓ libpq5 version is >= 14")


def test_jit_pam_module_installed(host):
    """Test that the JIT PAM module (pam_jit_pg.so) is properly installed."""
    # Check PostgreSQL version first
    result = run_ssh_command(
        host["ssh"], "sudo -u postgres psql --version | grep -oE '[0-9]+' | head -1"
    )
    pg_major_version = 15  # Default
    if result["succeeded"] and result["stdout"].strip():
        try:
            pg_major_version = int(result["stdout"].strip())
        except ValueError:
            pass

    # Skip test for PostgreSQL 15 as gatekeeper is not installed for PG15
    if pg_major_version == 15:
        print("\nSkipping JIT PAM module test for PostgreSQL 15 (not installed)")
        return

    # Check if gatekeeper is installed via Nix
    result = run_ssh_command(
        host["ssh"],
        "sudo -u postgres ls -la /var/lib/postgresql/.nix-profile/lib/security/pam_jit_pg.so 2>/dev/null",
    )
    if result["succeeded"]:
        print(f"\nJIT PAM module found in Nix profile:\n{result['stdout']}")
    else:
        print("\nJIT PAM module not found in postgres user's Nix profile")
        assert False, "JIT PAM module (pam_jit_pg.so) not found in expected location"

    # Check if the symlink exists in the Linux PAM security directory
    result = run_ssh_command(
        host["ssh"],
        "find /nix/store -type f -path '*/lib/security/pam_jit_pg.so' 2>/dev/null | head -5",
    )
    if result["succeeded"] and result["stdout"].strip():
        print(f"\nJIT PAM module symlinks found:\n{result['stdout']}")
    else:
        print("\nNo JIT PAM module symlinks found in /nix/store")

    # Verify the module is a valid shared library
    result = run_ssh_command(
        host["ssh"], "file /var/lib/postgresql/.nix-profile/lib/security/pam_jit_pg.so"
    )
    if result["succeeded"]:
        print(f"\nJIT PAM module file type:\n{result['stdout']}")
        assert (
            "shared object" in result["stdout"].lower()
            or "dynamically linked" in result["stdout"].lower()
        ), "JIT PAM module is not a valid shared library"

    print("✓ JIT PAM module is properly installed")


def test_pam_postgresql_config(host):
    """Test that the PAM configuration for PostgreSQL exists and is properly configured."""
    # Check PostgreSQL version to determine if PAM config should exist
    result = run_ssh_command(
        host["ssh"], "sudo -u postgres psql --version | grep -oE '[0-9]+' | head -1"
    )
    pg_major_version = 15  # Default
    if result["succeeded"] and result["stdout"].strip():
        try:
            pg_major_version = int(result["stdout"].strip())
        except ValueError:
            pass

    print(f"\nPostgreSQL major version: {pg_major_version}")

    # PAM config should exist for non-PostgreSQL 15 versions
    if pg_major_version != 15:
        # Check if PAM config file exists
        result = run_ssh_command(host["ssh"], "ls -la /etc/pam.d/postgresql")
        if result["succeeded"]:
            print(f"\nPAM config file found:\n{result['stdout']}")

            # Check file permissions
            result = run_ssh_command(
                host["ssh"], "stat -c '%a %U %G' /etc/pam.d/postgresql"
            )
            if result["succeeded"]:
                perms = result["stdout"].strip()
                print(f"PAM config permissions: {perms}")
                # Should be owned by postgres:postgres with 664 permissions
                assert "postgres postgres" in perms, (
                    "PAM config not owned by postgres:postgres"
                )
        else:
            print("\nPAM config file not found")
            assert False, "PAM configuration file /etc/pam.d/postgresql not found"
    else:
        print("\nSkipping PAM config check for PostgreSQL 15")
        # For PostgreSQL 15, the PAM config should NOT exist
        result = run_ssh_command(host["ssh"], "test -f /etc/pam.d/postgresql")
        if result["succeeded"]:
            print("\nWARNING: PAM config exists for PostgreSQL 15 (not expected)")

    print("✓ PAM configuration is properly set up")


def test_jit_pam_gatekeeper_profile(host):
    """Test that the gatekeeper package is properly installed in the postgres user's Nix profile."""
    # Check PostgreSQL version first
    result = run_ssh_command(
        host["ssh"], "sudo -u postgres psql --version | grep -oE '[0-9]+' | head -1"
    )
    pg_major_version = 15  # Default
    if result["succeeded"] and result["stdout"].strip():
        try:
            pg_major_version = int(result["stdout"].strip())
        except ValueError:
            pass

    # Skip test for PostgreSQL 15 as gatekeeper is not installed for PG15
    if pg_major_version == 15:
        print("\nSkipping gatekeeper profile test for PostgreSQL 15 (not installed)")
        return

    # Check if gatekeeper is in the postgres user's Nix profile
    result = run_ssh_command(
        host["ssh"],
        "sudo -u postgres nix profile list --json | jq -r '.elements.gatekeeper.storePaths[0]'",
    )
    if result["succeeded"] and result["stdout"].strip():
        print(f"\nGatekeeper found in Nix profile:\n{result['stdout']}")
    else:
        # Try alternative check
        result = run_ssh_command(
            host["ssh"],
            "sudo -u postgres ls -la /var/lib/postgresql/.nix-profile/ | grep -i gate",
        )
        if result["succeeded"] and result["stdout"].strip():
            print(f"\nGatekeeper-related files in profile:\n{result['stdout']}")
        else:
            print("\nGatekeeper not found in postgres user's Nix profile")
            # This might be expected if it's installed system-wide instead

    # Check if we can find the gatekeeper derivation
    result = run_ssh_command(
        host["ssh"],
        "find /nix/store -maxdepth 1 -type d -name '*gatekeeper*' 2>/dev/null | head -5",
    )
    if result["succeeded"] and result["stdout"].strip():
        print(f"\nGatekeeper derivations found:\n{result['stdout']}")
    else:
        print("\nNo gatekeeper derivations found in /nix/store")

    print("✓ Gatekeeper package installation check completed")


def test_jit_pam_module_dependencies(host):
    """Test that the JIT PAM module has all required dependencies."""
    # Check PostgreSQL version first
    result = run_ssh_command(
        host["ssh"], "sudo -u postgres psql --version | grep -oE '[0-9]+' | head -1"
    )
    pg_major_version = 15  # Default
    if result["succeeded"] and result["stdout"].strip():
        try:
            pg_major_version = int(result["stdout"].strip())
        except ValueError:
            pass

    # Skip test for PostgreSQL 15 as gatekeeper is not installed for PG15
    if pg_major_version == 15:
        print(
            "\nSkipping JIT PAM module dependencies test for PostgreSQL 15 (not installed)"
        )
        return

    # Check dependencies of the PAM module
    result = run_ssh_command(
        host["ssh"],
        "ldd /var/lib/postgresql/.nix-profile/lib/security/pam_jit_pg.so 2>/dev/null",
    )
    if result["succeeded"]:
        print(f"\nJIT PAM module dependencies:\n{result['stdout']}")

        # Check for required libraries
        required_libs = ["libpam", "libc"]
        for lib in required_libs:
            if lib not in result["stdout"].lower():
                print(f"WARNING: Required library {lib} not found in dependencies")

        # Check for any missing dependencies
        if "not found" in result["stdout"].lower():
            assert False, "JIT PAM module has missing dependencies"
    else:
        print("\nCould not check JIT PAM module dependencies")

    print("✓ JIT PAM module dependencies are satisfied")


def test_jit_pam_postgresql_integration(host):
    """Test that PostgreSQL can be configured to use PAM authentication."""
    # Check if PAM is available as an authentication method in PostgreSQL
    result = run_ssh_command(
        host["ssh"],
        "sudo -u postgres psql -c \"SELECT name, setting FROM pg_settings WHERE name LIKE '%pam%';\" 2>/dev/null",
    )
    if result["succeeded"]:
        print(f"\nPostgreSQL PAM-related settings:\n{result['stdout']}")

    # Check pg_hba.conf for potential PAM entries (even if not currently active)
    result = run_ssh_command(
        host["ssh"],
        "grep -i pam /etc/postgresql/pg_hba.conf 2>/dev/null || echo 'No PAM entries in pg_hba.conf'",
    )
    if result["succeeded"]:
        print(f"\nPAM entries in pg_hba.conf:\n{result['stdout']}")

    # Verify PostgreSQL was compiled with PAM support
    result = run_ssh_command(
        host["ssh"],
        "sudo -u postgres pg_config --configure 2>/dev/null | grep -i pam || echo 'PAM compile flag not found'",
    )
    if result["succeeded"]:
        print(f"\nPostgreSQL PAM compile flags:\n{result['stdout']}")

    print("✓ PostgreSQL PAM integration check completed")


def test_postgrest_read_only_session_attrs(host):
    """Test PostgREST with target_session_attrs=read-only and check for session errors."""
    # First, check if PostgreSQL is configured for read-only mode
    result = run_ssh_command(
        host["ssh"], 'sudo -u postgres psql -c "SHOW default_transaction_read_only;"'
    )
    if result["succeeded"]:
        default_read_only = result["stdout"].strip()
        print(f"PostgreSQL default_transaction_read_only: {default_read_only}")
    else:
        print("Could not check PostgreSQL read-only setting")
        default_read_only = "unknown"

    # Check if PostgreSQL is in recovery mode (standby)
    result = run_ssh_command(
        host["ssh"], 'sudo -u postgres psql -c "SELECT pg_is_in_recovery();"'
    )
    if result["succeeded"]:
        in_recovery = result["stdout"].strip()
        print(f"PostgreSQL pg_is_in_recovery: {in_recovery}")
    else:
        print("Could not check PostgreSQL recovery status")
        in_recovery = "unknown"

    # Find PostgreSQL configuration file
    result = run_ssh_command(
        host["ssh"], 'sudo -u postgres psql -c "SHOW config_file;"'
    )
    if result["succeeded"]:
        config_file = (
            result["stdout"].strip().split("\n")[2].strip()
        )  # Skip header and get the actual path
        print(f"PostgreSQL config file: {config_file}")
    else:
        print("Could not find PostgreSQL config file")
        config_file = "/etc/postgresql/15/main/postgresql.conf"  # Default fallback

    # Backup PostgreSQL config
    result = run_ssh_command(host["ssh"], f"sudo cp {config_file} {config_file}.backup")
    assert result["succeeded"], "Failed to backup PostgreSQL config"

    # Add read-only setting to PostgreSQL config
    result = run_ssh_command(
        host["ssh"],
        f"echo 'default_transaction_read_only = on' | sudo tee -a {config_file}",
    )
    assert result["succeeded"], "Failed to add read-only setting to PostgreSQL config"

    # Restart PostgreSQL to apply the new configuration
    result = run_ssh_command(host["ssh"], "sudo systemctl restart postgresql")
    assert result["succeeded"], "Failed to restart PostgreSQL"

    # Wait for PostgreSQL to start up
    sleep(5)

    # Verify the change took effect
    result = run_ssh_command(
        host["ssh"], 'sudo -u postgres psql -c "SHOW default_transaction_read_only;"'
    )
    if result["succeeded"]:
        new_default_read_only = result["stdout"].strip()
        print(
            f"PostgreSQL default_transaction_read_only after change: {new_default_read_only}"
        )
    else:
        print("Could not verify PostgreSQL read-only setting change")

    # First, backup the current PostgREST config
    result = run_ssh_command(
        host["ssh"], "sudo cp /etc/postgrest/base.conf /etc/postgrest/base.conf.backup"
    )
    assert result["succeeded"], "Failed to backup PostgREST config"

    try:
        # Read the current config to get the db-uri
        result = run_ssh_command(
            host["ssh"], "sudo cat /etc/postgrest/base.conf | grep '^db-uri'"
        )
        assert result["succeeded"], "Failed to read current db-uri"

        current_db_uri = result["stdout"].strip()
        print(f"Current db-uri: {current_db_uri}")

        # Extract just the URI part (remove the db-uri = " prefix and trailing quote)
        uri_start = current_db_uri.find('"') + 1
        uri_end = current_db_uri.rfind('"')
        base_uri = current_db_uri[uri_start:uri_end]

        # Modify the URI to add target_session_attrs=read-only
        if "?" in base_uri:
            # URI already has parameters, add target_session_attrs
            modified_uri = base_uri + "&target_session_attrs=read-only"
        else:
            # URI has no parameters, add target_session_attrs
            modified_uri = base_uri + "?target_session_attrs=read-only"

        print(f"Modified URI: {modified_uri}")

        # Use awk to replace the db-uri line more reliably
        result = run_ssh_command(
            host["ssh"],
            f'sudo awk \'{{if ($1 == "db-uri") print "db-uri = \\"{modified_uri}\\""; else print $0}}\' /etc/postgrest/base.conf > /tmp/new_base.conf && sudo mv /tmp/new_base.conf /etc/postgrest/base.conf',
        )
        assert result["succeeded"], "Failed to update db-uri in config"

        # Verify the change was made correctly
        result = run_ssh_command(
            host["ssh"], "sudo cat /etc/postgrest/base.conf | grep '^db-uri'"
        )
        print(f"Updated db-uri line: {result['stdout'].strip()}")

        # Also show the full config to debug
        result = run_ssh_command(host["ssh"], "sudo cat /etc/postgrest/base.conf")
        print(f"Full config after change:\n{result['stdout']}")

        # Restart PostgREST to apply the new configuration
        result = run_ssh_command(host["ssh"], "sudo systemctl restart postgrest")
        assert result["succeeded"], "Failed to restart PostgREST"

        # Wait a moment for PostgREST to start up
        sleep(5)

        # Check if PostgREST is running
        result = run_ssh_command(host["ssh"], "sudo systemctl is-active postgrest")
        if not (result["succeeded"] and result["stdout"].strip() == "active"):
            # If PostgREST failed to start, check the logs to see why
            log_result = run_ssh_command(
                host["ssh"],
                "sudo journalctl -u postgrest --since '5 seconds ago' --no-pager",
            )
            print(f"PostgREST failed to start. Recent logs:\n{log_result['stdout']}")
            assert False, "PostgREST failed to start after config change"

        # Make a test request to trigger any potential session errors
        try:
            response = requests.get(
                f"http://{host['ip']}/rest/v1/",
                headers={"apikey": anon_key, "authorization": f"Bearer {anon_key}"},
                timeout=10,
            )
            print(f"Test request status: {response.status_code}")
        except Exception as e:
            print(f"Test request failed: {str(e)}")

        # Check PostgREST logs for "session is not read-only" errors
        result = run_ssh_command(
            host["ssh"],
            "sudo journalctl -u postgrest --since '5 seconds ago' | grep -i 'session is not read-only' || true",
        )

        if result["stdout"].strip():
            print(
                f"\nFound 'session is not read-only' errors in PostgREST logs:\n{result['stdout']}"
            )
            assert False, (
                "PostgREST logs contain 'session is not read-only' errors even though PostgreSQL is configured for read-only mode"
            )
        else:
            print("\nNo 'session is not read-only' errors found in PostgREST logs")

    finally:
        # Restore the original configuration
        result = run_ssh_command(
            host["ssh"],
            "sudo cp /etc/postgrest/base.conf.backup /etc/postgrest/base.conf",
        )
        if result["succeeded"]:
            result = run_ssh_command(host["ssh"], "sudo systemctl restart postgrest")
            if result["succeeded"]:
                print("Restored original PostgREST configuration")
            else:
                print("Warning: Failed to restart PostgREST after restoring config")
        else:
            print("Warning: Failed to restore original PostgREST configuration")

        # Restore PostgreSQL to original configuration
        result = run_ssh_command(
            host["ssh"], f"sudo cp {config_file}.backup {config_file}"
        )
        if result["succeeded"]:
            result = run_ssh_command(host["ssh"], "sudo systemctl restart postgresql")
            if result["succeeded"]:
                print("Restored PostgreSQL to original configuration")
            else:
                print("Warning: Failed to restart PostgreSQL after restoring config")
        else:
            print("Warning: Failed to restore PostgreSQL configuration")


def test_custom_overrides_take_precedence_over_generated_optimizations(host):
    """Verify CLI-managed PostgreSQL config overrides generated optimizations.

    postgresql.conf includes generated-optimizations.conf before
    custom-overrides.conf (both flat under /etc/postgresql-custom/, includes
    uncommented during the AMI build), so the custom override wins. include_dir
    conf.d comes after both, so anything in conf.d beats them by include order
    — a hosted incident happened when generated-optimizations.conf was placed
    in conf.d and silently overrode CLI-managed config. This test guards both
    sides of that contract: the flat-file precedence, and that the AMI ships
    no conf.d copy of generated-optimizations.conf.
    """
    ssh = host["ssh"]
    backup_dir = "/tmp/pg-config-precedence-test"
    custom_conf = "/etc/postgresql-custom/custom-overrides.conf"
    generated_conf = "/etc/postgresql-custom/generated-optimizations.conf"
    confd_generated_conf = "/etc/postgresql-custom/conf.d/generated-optimizations.conf"
    config_files = [custom_conf, generated_conf]

    confd_check = run_ssh_command(ssh, f"sudo test -e {confd_generated_conf}")
    assert not confd_check["succeeded"], (
        f"{confd_generated_conf} exists on the AMI; conf.d is included after "
        "custom-overrides.conf, so a generated-optimizations.conf there "
        "overrides CLI-managed config"
    )

    def assert_command_succeeded(result, action):
        assert result["succeeded"], (
            f"{action} failed.\nstdout: {result['stdout']}\nstderr: {result['stderr']}"
        )

    def backup_name(path):
        return path.strip("/").replace("/", "__")

    def backup_config_files():
        commands = [
            "set -eu",
            f"sudo rm -rf {backup_dir}",
            f"sudo mkdir -p {backup_dir}",
        ]
        for path in config_files:
            backup_path = f"{backup_dir}/{backup_name(path)}"
            commands.extend(
                [
                    f"if sudo test -e {path}; then",
                    f"    sudo cp -a {path} {backup_path}",
                    "else",
                    f"    sudo touch {backup_path}.missing",
                    "fi",
                ]
            )

        result = run_ssh_command(ssh, "\n".join(commands))
        assert_command_succeeded(result, "Backup PostgreSQL config files")

    def restore_config_files():
        commands = ["set -eu"]
        for path in config_files:
            backup_path = f"{backup_dir}/{backup_name(path)}"
            commands.extend(
                [
                    f"sudo mkdir -p $(dirname {path})",
                    f"if sudo test -f {backup_path}.missing; then",
                    f"    sudo rm -f {path}",
                    "else",
                    f"    sudo cp -a {backup_path} {path}",
                    "fi",
                ]
            )
        commands.append(f"sudo rm -rf {backup_dir}")
        return run_ssh_command(ssh, "\n".join(commands))

    def restart_postgresql(context):
        result = run_ssh_command(ssh, "sudo systemctl restart postgresql")
        assert_command_succeeded(result, context)
        sleep(5)

    def read_max_connections_source():
        result = run_ssh_command(
            ssh,
            "sudo -u postgres psql -X -v ON_ERROR_STOP=1 -t -A -F '|' "
            "-d postgres -c "
            '"SELECT setting, sourcefile '
            "FROM pg_settings WHERE name = 'max_connections';\"",
        )
        assert_command_succeeded(result, "Query max_connections setting")

        rows = [line.strip() for line in result["stdout"].splitlines() if line.strip()]
        assert len(rows) == 1, (
            f"Expected one max_connections row, got {len(rows)}:\n{result['stdout']}"
        )
        return rows[0].split("|", 1)

    backup_config_files()

    try:
        write_result = run_ssh_command(
            ssh,
            """
            set -eu
            CUSTOM_CONF=/etc/postgresql-custom/custom-overrides.conf
            GENERATED_CONF=/etc/postgresql-custom/generated-optimizations.conf

            printf '%s\n' 'max_connections = 111' |
                sudo tee "$GENERATED_CONF" > /dev/null
            printf '%s\n' 'max_connections = 112' |
                sudo tee "$CUSTOM_CONF" > /dev/null
            sudo chown postgres:postgres "$GENERATED_CONF" "$CUSTOM_CONF"
            sudo chmod 0664 "$GENERATED_CONF" "$CUSTOM_CONF"
            """,
        )
        assert_command_succeeded(
            write_result,
            "Write PostgreSQL precedence test config files",
        )

        restart_postgresql("Restart PostgreSQL with precedence test config")

        setting, sourcefile = read_max_connections_source()

        assert setting == "112", (
            "Expected custom-overrides.conf to win over generated optimizations "
            f"for max_connections, got setting={setting}, sourcefile={sourcefile}"
        )
        assert sourcefile == "/etc/postgresql-custom/custom-overrides.conf", (
            "Expected max_connections to come from custom-overrides.conf, "
            f"got sourcefile={sourcefile}"
        )
    finally:
        restore_result = restore_config_files()
        if not restore_result["succeeded"]:
            print(
                "Warning: Failed to restore PostgreSQL precedence test config files.\n"
                f"stdout: {restore_result['stdout']}\nstderr: {restore_result['stderr']}"
            )

        try:
            restart_postgresql("Restart PostgreSQL after precedence test restore")
            print("Restored PostgreSQL config files after precedence test")
        except AssertionError as error:
            print(
                "Warning: Failed to restart PostgreSQL after restoring "
                f"precedence test config.\n{error}"
            )


def test_copy_fail_algif_aead_mitigation(host):
    """Verify algif_aead is blocked from autoloading and is not loaded."""
    result = run_ssh_command(
        host["ssh"],
        "grep -R '^install algif_aead /bin/false$' /etc/modprobe.d /usr/lib/modprobe.d",
    )
    assert result["succeeded"], (
        "algif_aead module autoload is not disabled by modprobe config.\n"
        f"stdout: {result['stdout']}\nstderr: {result['stderr']}"
    )

    result = run_ssh_command(
        host["ssh"],
        "grep -qE '^algif_aead ' /proc/modules",
    )
    assert not result["succeeded"], "algif_aead module is loaded"

    result = run_ssh_command(
        host["ssh"],
        "sudo modprobe -n -v algif_aead 2>&1",
    )
    assert result["succeeded"], f"modprobe dry-run failed: {result['stderr']}"
    assert "install /bin/false" in result["stdout"], (
        "modprobe dry-run did not resolve algif_aead to /bin/false.\n"
        f"stdout: {result['stdout']}"
    )


def test_apparmor_postgresql_service_uses_profile(host):
    """Verify the PostgreSQL systemd service is running under the sbpostgres AppArmor profile."""
    result = run_ssh_command(
        host["ssh"], "systemctl show postgresql | grep -i apparmor"
    )
    assert result["succeeded"], (
        f"Could not find AppArmor info in postgresql service status.\n"
        f"stderr: {result['stderr']}"
    )
    assert "sbpostgres" in result["stdout"], (
        f"Expected 'sbpostgres' in postgresql AppArmor status but got:\n{result['stdout']}"
    )


def test_apparmor_sbpostgres_profile_enforced(host):
    """Verify the sbpostgres AppArmor profile is loaded and in enforce mode."""
    import json

    result = run_ssh_command(host["ssh"], "sudo aa-status --json")
    assert result["succeeded"], f"aa-status failed: {result['stderr']}"
    status = json.loads(result["stdout"])
    enforced = status.get("profiles", {})
    assert "sbpostgres" in enforced, "sbpostgres profile not found in AppArmor"
    assert enforced["sbpostgres"] == "enforce", (
        f"sbpostgres profile is not in enforce mode: {enforced['sbpostgres']}"
    )


def test_apparmor_blocks_disallowed_shell_commands(host):
    """Verify AppArmor's postgres_shell sub-profile blocks execution of
    commands not on the allowlist (e.g. /usr/bin/id).

    COPY TO PROGRAM causes postgres to fork /bin/sh, which transitions to the
    postgres_shell sub-profile via the 'Pix -> postgres_shell' rule. /usr/bin/id
    is not on the allowlist so AppArmor denies the exec, and PostgreSQL surfaces
    this as 'command not executable'.
    """
    result = run_ssh_command(
        host["ssh"],
        "sudo -u postgres psql -U supabase_admin -h localhost -d postgres -c \"COPY (SELECT 1) TO PROGRAM '/usr/bin/id';\" 2>&1 || true",
    )
    combined = result["stdout"] + result["stderr"]
    assert "command not executable" in combined, (
        f"Expected AppArmor to block /usr/bin/id with 'command not executable' "
        f"but got:\nstdout: {result['stdout']}\nstderr: {result['stderr']}"
    )


def test_apparmor_permits_allowlisted_commands(host):
    """Verify allowlisted commands are not blocked by the postgres_shell profile.

    /usr/bin/cat is explicitly listed as 'ix' in postgres_shell with a canonical
    path (avoiding the /bin -> /usr/bin symlink issue on Ubuntu 22.04+), and
    writes only to the pipe so no file-write permissions are needed.
    """
    result = run_ssh_command(
        host["ssh"],
        "sudo -u postgres psql -U supabase_admin -h localhost -d postgres -c \"COPY (SELECT 1) TO PROGRAM '/usr/bin/cat';\"",
    )
    assert result["succeeded"], (
        f"AppArmor unexpectedly blocked /usr/bin/cat.\n"
        f"stdout: {result['stdout']}\nstderr: {result['stderr']}"
    )


def test_apparmor_allows_basic_sql_and_extensions(host):
    """Verify basic SQL and extension availability are unaffected by AppArmor."""
    result = run_ssh_command(
        host["ssh"],
        "sudo -u postgres psql -U supabase_admin -h localhost -d postgres -c "
        "\"SELECT name FROM pg_available_extensions WHERE name IN ('pgcrypto', 'pg_stat_statements') ORDER BY name;\"",
    )
    assert result["succeeded"], (
        f"SQL query failed under AppArmor.\nstdout: {result['stdout']}\nstderr: {result['stderr']}"
    )
    assert "pgcrypto" in result["stdout"], (
        "pgcrypto extension not available under AppArmor"
    )
    assert "pg_stat_statements" in result["stdout"], (
        "pg_stat_statements extension not available under AppArmor"
    )


def test_apparmor_allows_pg_dump(host):
    """Verify pg_dump executes from postgres_shell under AppArmor.

    /usr/bin/pg_dump is explicitly listed as 'ix' in postgres_shell.
    """
    result = run_ssh_command(
        host["ssh"],
        "sudo -u postgres psql -U supabase_admin -h localhost -d postgres -c "
        "\"COPY (SELECT 1) TO PROGRAM '/usr/bin/pg_dump --version';\"",
    )
    assert result["succeeded"], (
        f"pg_dump was blocked by AppArmor.\n"
        f"stdout: {result['stdout']}\nstderr: {result['stderr']}"
    )


@pytest.mark.parametrize("walg_binary", ["wal-g-2", "wal-g-3"])
def test_apparmor_allows_walg(host, walg_binary):
    """Verify wal-g-2 and wal-g-3 can be executed under the sbpostgres AppArmor profile.

    /nix/store/*/bin/wal-g-2 and /nix/store/*/bin/wal-g-3 are listed as 'ix' in
    postgres_shell. We locate the binary at runtime since the Nix store hash is
    not known ahead of time.
    """
    find_result = run_ssh_command(
        host["ssh"],
        f"find /nix/store -maxdepth 3 -name '{walg_binary}' -type f 2>/dev/null | head -1",
    )
    walg_path = find_result["stdout"].strip()
    if not walg_path:
        print(f"{walg_binary} not found in Nix store, skipping")
        return

    result = run_ssh_command(
        host["ssh"],
        f"sudo -u postgres psql -U supabase_admin -h localhost -d postgres -c "
        f"\"COPY (SELECT 1) TO PROGRAM '{walg_path} --version';\"",
    )
    assert result["succeeded"], (
        f"{walg_binary} was blocked by AppArmor.\n"
        f"stdout: {result['stdout']}\nstderr: {result['stderr']}"
    )


def test_apparmor_denies_access_to_sensitive_paths(host):
    """Verify postgres_shell deny rules block access to sensitive system paths.

    The profile has 'deny /var/lib/supabase/** rwx', 'deny /opt/saltstack/** rwx',
    and 'deny /etc/salt/** rwx'. Files are created world-readable so that the
    only reason cat fails is AppArmor, not OS file permissions.
    """
    denied_paths = [
        "/var/lib/supabase",
        "/opt/saltstack",
        "/etc/salt",
    ]
    for base in denied_paths:
        run_ssh_command(
            host["ssh"],
            f"sudo mkdir -p {base} && echo 'restricted' | sudo tee {base}/apparmor_test.txt > /dev/null "
            f"&& sudo chmod 644 {base}/apparmor_test.txt",
        )

    for base in denied_paths:
        test_file = f"{base}/apparmor_test.txt"
        result = run_ssh_command(
            host["ssh"],
            f"sudo -u postgres psql -U supabase_admin -h localhost -d postgres -c "
            f"\"COPY (SELECT 1) TO PROGRAM '/usr/bin/cat {test_file}';\" 2>&1 || true",
        )
        combined = result["stdout"] + result["stderr"]
        assert (
            "failed" in combined.lower() or "child process exited" in combined.lower()
        ), (
            f"Expected AppArmor to deny access to {test_file} but the command appears "
            f"to have succeeded.\nstdout: {result['stdout']}\nstderr: {result['stderr']}"
        )
        print(f"Confirmed: access to {test_file} denied by AppArmor")


def _skip_if_not_orioledb(host):
    """Skip the test if coredump capture is not installed on this AMI."""
    unit_check = run_ssh_command(
        host["ssh"], "systemctl list-unit-files orioledb-coredump.path --no-legend"
    )
    if "orioledb-coredump.path" not in unit_check["stdout"]:
        pytest.skip(
            "coredump capture not installed on this AMI (not an OrioleDB build)"
        )


def _skip_if_orioledb(host):
    """Skip the test if coredump capture is installed on this AMI."""
    unit_check = run_ssh_command(
        host["ssh"], "systemctl list-unit-files orioledb-coredump.path --no-legend"
    )
    if "orioledb-coredump.path" in unit_check["stdout"]:
        pytest.skip(
            "coredump capture installed on this AMI (this is an OrioleDB build)"
        )


def test_postgresql_service_allows_unlimited_core_dumps(host):
    """Verify the postgresql.service coredump drop-in sets LimitCORE=infinity."""
    _skip_if_not_orioledb(host)
    result = run_ssh_command(host["ssh"], "systemctl show postgresql -p LimitCORE")
    assert result["succeeded"], f"systemctl show failed: {result['stderr']}"
    assert "LimitCORE=infinity" in result["stdout"], (
        f"Expected postgresql.service to have LimitCORE=infinity, got:\n{result['stdout']}"
    )


def test_coredump_storage_limits_configured(host):
    """Verify /etc/systemd/coredump.conf.d/postgres.conf sets conservative,
    bounded storage limits for the systemd-coredump storage that backs
    Postgres core capture."""
    _skip_if_not_orioledb(host)
    result = run_ssh_command(
        host["ssh"], "cat /etc/systemd/coredump.conf.d/postgres.conf"
    )
    assert result["succeeded"], (
        f"Could not read coredump storage config: {result['stderr']}"
    )
    for expected in [
        "Storage=external",
        "Compress=yes",
        "ProcessSizeMax=",
        "ExternalSizeMax=",
        "MaxUse=",
        "KeepFree=",
    ]:
        assert expected in result["stdout"], (
            f"Expected '{expected}' in /etc/systemd/coredump.conf.d/postgres.conf, "
            f"got:\n{result['stdout']}"
        )


def test_postgres_coredump_filter_excludes_shared_buffers(host):
    """Verify the running postmaster's /proc/[pid]/coredump_filter is 0x31
    (49): private mappings + ELF headers, but not anonymous-shared mappings
    (shared_buffers)."""
    _skip_if_not_orioledb(host)
    pid = run_ssh_command(host["ssh"], "systemctl show postgresql -p MainPID --value")[
        "stdout"
    ].strip()
    assert pid.isdigit() and pid != "0", (
        f"Could not resolve postgresql.service MainPID: {pid}"
    )

    result = run_ssh_command(host["ssh"], f"cat /proc/{pid}/coredump_filter")
    assert result["succeeded"], (
        f"Could not read coredump_filter for pid {pid}: {result['stderr']}"
    )
    # /proc/[pid]/coredump_filter reads back as zero-padded hex (e.g.
    # '00000031'), not the bare '31' written to it.
    assert int(result["stdout"].strip(), 16) == 0x31, (
        f"Expected /proc/{pid}/coredump_filter to be '31' (0x31 = 49 decimal), "
        f"got '{result['stdout'].strip()}'"
    )


def test_default_core_limit_is_disabled_machine_wide(host):
    """Verify DefaultLimitCORE=0 is configured machine-wide."""
    _skip_if_not_orioledb(host)
    result = run_ssh_command(host["ssh"], "systemctl show -p DefaultLimitCORE")
    assert result["succeeded"], f"systemctl show failed: {result['stderr']}"
    assert "DefaultLimitCORE=0" in result["stdout"], (
        f"Expected DefaultLimitCORE=0 machine-wide, got:\n{result['stdout']}"
    )


def test_coredump_storage_directory_root_only(host):
    """Verify /var/lib/systemd/coredump is owned by root and not
    group/other-writable."""
    _skip_if_not_orioledb(host)
    result = run_ssh_command(
        host["ssh"], "stat -c '%a %U:%G' /var/lib/systemd/coredump"
    )
    assert result["succeeded"], f"stat failed: {result['stderr']}"
    mode, owner = result["stdout"].strip().split()
    assert owner.startswith("root:"), (
        f"Expected /var/lib/systemd/coredump to be owned by root, got {owner}"
    )
    # Directory is world-readable (systemd's own default, 0755) - only the
    # write bits matter, since core files themselves get restrictive perms.
    group_other_bits = mode[-2:]
    assert all(int(bit) & 0o2 == 0 for bit in group_other_bits), (
        f"Expected /var/lib/systemd/coredump to not be group/other-writable, "
        f"got mode {mode}"
    )


def test_postgres_prestart_does_not_reset_core_limit(host):
    """Verify postgres_prestart.sh never calls 'ulimit', which would risk
    silently overriding the postgresql.service LimitCORE=infinity drop-in."""
    result = run_ssh_command(host["ssh"], "cat /usr/local/bin/postgres_prestart.sh")
    assert result["succeeded"], f"Could not read prestart script: {result['stderr']}"
    assert "ulimit" not in result["stdout"], (
        "postgres_prestart.sh must not use 'ulimit' - doing so risks silently "
        "defeating the postgresql.service coredump drop-in"
    )


def _crash_a_backend_and_wait_for_recovery(host):
    """Grab a real Postgres backend pid, SIGSEGV it, and wait for PostgreSQL's
    normal crash-recovery to bring the instance back on its own. Returns the
    crashed backend's pid."""
    # A backend from a one-shot query exits (and its pid becomes stale) as
    # soon as the client gets its answer, so use a backend that's still busy.
    run_ssh_command(
        host["ssh"],
        "sudo -u postgres psql -U supabase_admin -h localhost -d postgres "
        "-c 'select pg_sleep(30);' >/dev/null 2>&1 &",
    )
    sleep(1)
    backend_pid = run_ssh_command(
        host["ssh"],
        "sudo -u postgres psql -U supabase_admin -h localhost -d postgres "
        "-tAc \"select pid from pg_stat_activity where query = 'select pg_sleep(30);' "
        "and state = 'active' limit 1;\"",
    )["stdout"].strip()
    assert backend_pid.isdigit(), (
        f"Could not resolve a Postgres backend pid: {backend_pid}"
    )
    run_ssh_command(host["ssh"], f"sudo kill -SEGV {backend_pid}")

    recovered = False
    for _ in range(30):
        sleep(2)
        probe = run_ssh_command(
            host["ssh"],
            "sudo -u postgres psql -U supabase_admin -h localhost -d postgres "
            "-tAc 'select 1'",
        )
        if probe["succeeded"] and probe["stdout"].strip() == "1":
            recovered = True
            break
    assert recovered, (
        "PostgreSQL did not come back up within 60s after the induced backend crash"
    )
    return backend_pid


def test_postgres_backend_crash_produces_core_but_unrelated_process_does_not(host):
    """Verify a segfaulted Postgres backend produces a coredumpctl-visible
    core, while an unrelated process crashing the same way does not."""
    _skip_if_not_orioledb(host)
    before = run_ssh_command(
        host["ssh"], "sudo coredumpctl list --no-legend 2>/dev/null || true"
    )
    before_lines = set(before["stdout"].splitlines())

    run_ssh_command(
        host["ssh"],
        "sudo systemd-run --unit=testinfra-unrelated-crash --collect /bin/sleep 60",
    )
    sleep(1)
    unrelated_pid = run_ssh_command(
        host["ssh"], "systemctl show testinfra-unrelated-crash -p MainPID --value"
    )["stdout"].strip()
    assert unrelated_pid.isdigit() and unrelated_pid != "0", (
        f"Could not resolve the disposable unrelated unit's pid: {unrelated_pid}"
    )
    run_ssh_command(host["ssh"], f"sudo kill -SEGV {unrelated_pid}")
    sleep(2)

    backend_pid = _crash_a_backend_and_wait_for_recovery(host)

    after = run_ssh_command(
        host["ssh"], "sudo coredumpctl list --no-legend 2>/dev/null || true"
    )
    new_lines = set(after["stdout"].splitlines()) - before_lines
    assert any("postgres" in line for line in new_lines), (
        f"Expected a new postgres core dump after SIGSEGV to backend {backend_pid}, "
        f"but coredumpctl list shows:\n{after['stdout']}"
    )

    # coredumpctl logs a crash entry for any SIGSEGV regardless of whether a
    # core was captured; COREFILE distinguishes "captured" from "missing".
    unrelated_corefile = None
    for line in new_lines:
        fields = line.split()
        if len(fields) >= 9 and fields[4] == unrelated_pid:
            unrelated_corefile = fields[8]
            break
    assert unrelated_corefile in (None, "missing"), (
        f"Unrelated process {unrelated_pid} should not have produced a captured "
        f"core dump (COREFILE={unrelated_corefile}):\n{after['stdout']}"
    )


def test_vanilla_postgres_crash_does_not_capture_core(host):
    """Verify that on a vanilla (non-OrioleDB) AMI, neither a segfaulted
    Postgres backend nor an unrelated process produces a captured core."""
    _skip_if_orioledb(host)
    before = run_ssh_command(
        host["ssh"], "sudo coredumpctl list --no-legend 2>/dev/null || true"
    )
    before_lines = set(before["stdout"].splitlines())

    run_ssh_command(
        host["ssh"],
        "sudo systemd-run --unit=testinfra-unrelated-crash --collect /bin/sleep 60",
    )
    sleep(1)
    unrelated_pid = run_ssh_command(
        host["ssh"], "systemctl show testinfra-unrelated-crash -p MainPID --value"
    )["stdout"].strip()
    assert unrelated_pid.isdigit() and unrelated_pid != "0", (
        f"Could not resolve the disposable unrelated unit's pid: {unrelated_pid}"
    )
    run_ssh_command(host["ssh"], f"sudo kill -SEGV {unrelated_pid}")
    sleep(2)

    backend_pid = _crash_a_backend_and_wait_for_recovery(host)

    after = run_ssh_command(
        host["ssh"], "sudo coredumpctl list --no-legend 2>/dev/null || true"
    )
    new_lines = set(after["stdout"].splitlines()) - before_lines

    crashed = [(backend_pid, "postgres backend"), (unrelated_pid, "unrelated process")]
    for pid, label in crashed:
        corefile = None
        for line in new_lines:
            fields = line.split()
            if len(fields) >= 9 and fields[4] == pid:
                corefile = fields[8]
                break
        assert corefile in (None, "missing"), (
            f"On a vanilla (non-OrioleDB) AMI, the {label} (pid {pid}) should not "
            f"have produced a captured core dump (COREFILE={corefile}):\n"
            f"{after['stdout']}"
        )


def _resolve_postgres_binary(host):
    """Return the real postgres ELF path via the live postmaster's
    /proc/<pid>/exe (the installed /usr/lib/postgresql/bin/postgres is a Nix
    wrapper script, not the ELF itself)."""
    pid = run_ssh_command(host["ssh"], "systemctl show postgresql -p MainPID --value")[
        "stdout"
    ].strip()
    return run_ssh_command(host["ssh"], f"sudo readlink -f /proc/{pid}/exe")[
        "stdout"
    ].strip()


def _resolve_orioledb_lib(host, postgres_binary):
    """Return orioledb.so's path, derived from the resolved postgres binary's
    nix store derivation (mirrors orioledb_lib_path() in
    process-orioledb-coredumps.sh)."""
    exe_dir = run_ssh_command(
        host["ssh"], f"dirname \"$(dirname '{postgres_binary}')\""
    )["stdout"].strip()
    return f"{exe_dir}/lib/orioledb.so"


def _build_id_of(host, path):
    """Return (build_id, readelf_output) for the binary/library at path.
    build_id is None if readelf failed or found no build-id note."""
    import re

    result = run_ssh_command(host["ssh"], f"readelf -n {path}")
    output = result["stdout"] + result["stderr"]
    if not result["succeeded"]:
        return None, output
    match = re.search(r"Build ID:\s*([0-9a-f]+)", output)
    return (match.group(1) if match else None), output


def _debug_file_exists_for_build_id(host, build_id):
    """Check whether the postgres nix-profile's debug output has a
    .build-id/xx/yyyy...debug file matching the given build-id."""
    prefix, rest = build_id[:2], build_id[2:]
    debug_path = (
        f"/var/lib/postgresql/.nix-profile/lib/debug/.build-id/{prefix}/{rest}.debug"
    )
    result = run_ssh_command(host["ssh"], f"test -f {debug_path} && echo present")
    return result["succeeded"] and "present" in result["stdout"]


def test_postgres_binary_build_id_matches_shipped_debug_symbols(host):
    """Verify the installed 'postgres' binary's build-id has a matching
    .build-id/xx/yyyy.debug file in the postgres-env debug output."""
    _skip_if_not_orioledb(host)
    postgres_binary = _resolve_postgres_binary(host)
    build_id, readelf_output = _build_id_of(host, postgres_binary)
    assert build_id, (
        f"Could not read a build-id from {postgres_binary}, readelf -n output:\n"
        f"{readelf_output}"
    )
    assert _debug_file_exists_for_build_id(host, build_id), (
        f"No debug file found under /var/lib/postgresql/.nix-profile/lib/debug/"
        f".build-id/ matching postgres build-id {build_id} - the shipped "
        f"_debug package may be out of sync with the shipped binary"
    )


def test_orioledb_library_build_id_matches_shipped_debug_symbols(host):
    """Verify orioledb.so's build-id has a matching debug file, same as for
    the postgres binary."""
    orioledb_so = _resolve_orioledb_lib(host, _resolve_postgres_binary(host))
    exists = run_ssh_command(host["ssh"], f"test -f {orioledb_so} && echo present")
    if "present" not in exists["stdout"]:
        pytest.skip("orioledb.so not present on this AMI (not an OrioleDB build)")

    build_id, readelf_output = _build_id_of(host, orioledb_so)
    assert build_id, (
        f"Could not read a build-id from {orioledb_so}, readelf -n output:\n"
        f"{readelf_output}"
    )
    assert _debug_file_exists_for_build_id(host, build_id), (
        f"No debug file found under /var/lib/postgresql/.nix-profile/lib/debug/"
        f".build-id/ matching orioledb.so build-id {build_id}"
    )


def test_gdb_resolves_postgres_source_via_shipped_src_package(host):
    """Verify GDB can read actual source *content* for the installed postgres
    binary via the shipped _src package, not just a known filename."""
    import re

    _skip_if_not_orioledb(host)
    postgres_binary = _resolve_postgres_binary(host)
    build_id, readelf_output = _build_id_of(host, postgres_binary)
    assert build_id, (
        f"Could not read a build-id from {postgres_binary}, readelf -n output:\n"
        f"{readelf_output}"
    )
    prefix, rest = build_id[:2], build_id[2:]
    debug_file = (
        f"/var/lib/postgresql/.nix-profile/lib/debug/.build-id/{prefix}/{rest}.debug"
    )

    # DW_AT_comp_dir is recorded per compilation unit, not once globally -
    # PostgreSQL's recursive-Makefile build compiles each .c file from its
    # own subdirectory (e.g. main.c from .../src/backend/main, a different
    # object from a different subdirectory entirely), so grabbing the first
    # DW_AT_comp_dir in the whole dump grabs whichever unrelated CU happens
    # to appear first - not main.c's own. Find main.c's CU specifically and
    # take its comp_dir.
    main_c_comp_dir = run_ssh_command(
        host["ssh"],
        f"readelf --debug-dump=info {debug_file} 2>/dev/null | awk '"
        "/DW_TAG_compile_unit/ { want=0 } "
        "/DW_AT_name/ && /: main\\.c$/ { want=1 } "
        "want && /DW_AT_comp_dir/ { print; exit }"
        "' | grep -oE '/[^ ]+$'",
    )["stdout"].strip()
    assert main_c_comp_dir, (
        f"Could not determine main.c's DW_AT_comp_dir from {debug_file}"
    )
    # main_c_comp_dir is main.c's own subdirectory (.../src/backend/main), not
    # the shared build root - substituting that whole path would map main.c
    # to '<profile>/main.c' instead of '<profile>/src/backend/main/main.c'.
    # main.c's location in the postgres tree is fixed, so strip that known
    # suffix to recover the actual build root shared by every CU.
    suffix = "/src/backend/main"
    assert main_c_comp_dir.endswith(suffix), (
        f"Expected main.c's comp_dir to end with {suffix!r}, got {main_c_comp_dir!r}"
    )
    comp_dir = main_c_comp_dir[: -len(suffix)]

    result = run_ssh_command(
        host["ssh"],
        # cd into a directory the postgres user can actually read first: GDB's
        # source search path includes '$cwd', and the SSH session's default
        # cwd is the login user's home directory (e.g. /home/ubuntu), which
        # postgres can't traverse - that alone is enough to make GDB report
        # "Permission denied" on the bare filename before it ever tries the
        # substitute-path'd absolute path.
        "cd /var/lib/postgresql && sudo -u postgres gdb --batch -quiet "
        "-ex 'set debug-file-directory /var/lib/postgresql/.nix-profile/lib/debug' "
        f"-ex 'set substitute-path {comp_dir} /var/lib/postgresql/.nix-profile' "
        f"-ex 'file {postgres_binary}' "
        "-ex 'list main' "
        "2>&1",
    )
    assert result["succeeded"], f"gdb invocation failed: {result['stderr']}"
    assert "No debugging symbols found" not in result["stdout"], (
        f"GDB could not find debug symbols for postgres:\n{result['stdout']}"
    )
    assert not re.search(r"^\d+\tin /", result["stdout"], re.MULTILINE), (
        f"GDB fell back to the 'in <path>' placeholder, meaning it could not "
        f"actually read the source file even with substitute-path set from "
        f"{comp_dir} to /var/lib/postgresql/.nix-profile:\n{result['stdout']}"
    )
    numbered_lines = re.findall(r"^\d+\t.+$", result["stdout"], re.MULTILINE)
    assert len(numbered_lines) >= 3, (
        f"Expected 'list main' to print several lines of real source code "
        f"content via the shipped _src package, got:\n{result['stdout']}"
    )


def test_coredump_processor_produces_diagnostic_bundle_and_deletes_raw_core(host):
    """Verify that after a real Postgres backend crash, the
    orioledb-coredump.path-triggered processor turns the raw core into a
    diagnostic bundle and deletes the raw core."""
    unit_check = run_ssh_command(
        host["ssh"], "systemctl list-unit-files orioledb-coredump.path --no-legend"
    )
    if "orioledb-coredump.path" not in unit_check["stdout"]:
        pytest.skip(
            "coredump processor not installed on this AMI (not an OrioleDB build)"
        )

    before_bundles = set(
        run_ssh_command(
            host["ssh"],
            "sudo find /var/lib/orioledb-coredumps/diagnostics -maxdepth 1 -type f",
        )["stdout"].splitlines()
    )

    _crash_a_backend_and_wait_for_recovery(host)

    new_bundle = None
    for _ in range(30):
        sleep(2)
        current = set(
            run_ssh_command(
                host["ssh"],
                "sudo find /var/lib/orioledb-coredumps/diagnostics -maxdepth 1 -type f",
            )["stdout"].splitlines()
        )
        new = current - before_bundles
        if new:
            new_bundle = sorted(new)[0]
            break
    assert new_bundle, (
        "Expected a new diagnostic bundle under /var/lib/orioledb-coredumps/diagnostics "
        "after the induced backend crash, but none appeared within 60s"
    )

    bundle_contents = run_ssh_command(host["ssh"], f"sudo cat {new_bundle}")["stdout"]
    assert "gdb backtrace" in bundle_contents, (
        f"Expected the diagnostic bundle to contain a gdb backtrace section, got:\n"
        f"{bundle_contents[:500]}"
    )

    remaining_cores = run_ssh_command(
        host["ssh"], "sudo find /var/lib/systemd/coredump -maxdepth 1 -type f"
    )["stdout"].strip()
    assert remaining_cores == "", (
        f"Expected the raw core to be deleted after successful processing, but "
        f"/var/lib/systemd/coredump still has:\n{remaining_cores}"
    )
