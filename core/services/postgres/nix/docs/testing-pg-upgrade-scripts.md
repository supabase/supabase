# Testing PostgreSQL Upgrade Scripts

This document describes how to test changes to the PostgreSQL upgrade scripts on a running machine.

## Prerequisites

- A running PostgreSQL instance
- Access to the Supabase Postgres repository
- Permissions to run GitHub Actions workflows
- ssh access to the ec2 instance

## Development Workflow

1. **Make Changes to Upgrade Scripts**
   - Make your changes to the scripts in `ansible/files/admin_api_scripts/pg_upgrade_scripts/`
   - Commit and push your changes to your feature branch
   - For quick testing, you can also edit the script directly on the server at `/etc/adminapi/pg_upgrade_scripts/initiate.sh`

2. **Publish Script Changes** (Only needed for deploying to new instances)
   - Go to [publish-nix-pgupgrade-scripts.yml](https://github.com/supabase/postgres/actions/workflows/publish-nix-pgupgrade-scripts.yml)
   - Click "Run workflow"
   - Select your branch
   - Run the workflow

3. **Publish Binary Flake Version** (Only needed for deploying to new instances)
   - Go to [publish-nix-pgupgrade-bin-flake-version.yml](https://github.com/supabase/postgres/actions/workflows/publish-nix-pgupgrade-bin-flake-version.yml)
   - Click "Run workflow"
   - Select your branch
   - Run the workflow
   - Note: Make sure the flake version includes the PostgreSQL version you're testing (e.g., 17)

4. **Test on Running Machine**
   ssh into the machine
   ```bash
   # Stop PostgreSQL
   sudo systemctl stop postgresql

   # Run the upgrade script in local mode with your desired flake version
   sudo NIX_FLAKE_VERSION="your-flake-version-here" IS_LOCAL_UPGRADE=true /etc/adminapi/pg_upgrade_scripts/initiate.sh 17
   ```
   Note: This will use the version of the script that exists at `/etc/adminapi/pg_upgrade_scripts/initiate.sh` on the server.
   The script should be run as the ubuntu user with sudo privileges. The script will handle switching to the postgres user when needed.
   
   In local mode:
   - The script at `/etc/adminapi/pg_upgrade_scripts/initiate.sh` will be used (your edited version)
   - Only the PostgreSQL binaries will be downloaded from the specified flake version
   - No new upgrade scripts will be downloaded
   - You can override the flake version by setting the NIX_FLAKE_VERSION environment variable
   - If NIX_FLAKE_VERSION is not set, it will use the default flake version

5. **Monitor Progress**
   ```bash
   # Watch the upgrade log
   tail -f /var/log/pg-upgrade-initiate.log
   ```

6. **Check Results**
   In local mode, the script will:
   - Create a new data directory at `/data_migration/pgdata`
   - Run pg_upgrade to test the upgrade process
   - Generate SQL files in `/data_migration/sql/` for any needed post-upgrade steps
   - Log the results in `/var/log/pg-upgrade-initiate.log`
   
   To verify success:
   ```bash
   # Check the upgrade log for completion
   grep "Upgrade complete" /var/log/pg-upgrade-initiate.log
   
   # Check for any generated SQL files
   ls -l /data_migration/sql/
   
   # Check the new data directory
   ls -l /data_migration/pgdata/
   ```
   
   Note: The instance will not be upgraded to the new version in local mode. This is just a test run to verify the upgrade process works correctly.

## Important Notes

- The `IS_LOCAL_UPGRADE=true` flag makes the script run in the foreground and skip disk mounting steps
- The script will use the existing data directory
- All output is logged to `/var/log/pg-upgrade-initiate.log`
- The script will automatically restart PostgreSQL after completion or failure
- For testing, you can edit the script directly on the server - the GitHub Actions workflows are only needed for deploying to new instances
- Run the script as the ubuntu user with sudo privileges - the script will handle user switching internally
- Local mode is for testing only - it will not actually upgrade the instance
- The Nix flake version must include the PostgreSQL version you're testing (e.g., 17)
- In local mode, only the PostgreSQL binaries are downloaded from the flake - the upgrade scripts are used from the local filesystem
- You can override the flake version by setting the NIX_FLAKE_VERSION environment variable when running the script

## Troubleshooting

If the upgrade fails:
1. Check the logs at `/var/log/pg-upgrade-initiate.log`
2. Look for any error messages in the PostgreSQL logs
3. The script will attempt to clean up and restore the original state
4. If you see an error about missing Nix flake attributes, make sure the flake version includes the PostgreSQL version you're testing

Common Errors:
- `error: flake 'github:supabase/postgres/...' does not provide attribute 'packages.aarch64-linux.psql_17.bin'`
  - This means the Nix flake version doesn't include PostgreSQL 17 binaries
  - You need to specify a flake version that includes your target version
  - You can find valid flake versions by looking at the commit history of the publish-nix-pgupgrade-bin-flake-version.yml workflow

## Cleanup

After testing:
1. The script will automatically clean up temporary files
2. PostgreSQL will be restarted
3. The original configuration will be restored

## References

- [publish-nix-pgupgrade-scripts.yml](https://github.com/supabase/postgres/actions/workflows/publish-nix-pgupgrade-scripts.yml)
- [publish-nix-pgupgrade-bin-flake-version.yml](https://github.com/supabase/postgres/actions/workflows/publish-nix-pgupgrade-bin-flake-version.yml) 