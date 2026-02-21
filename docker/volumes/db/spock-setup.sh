#!/bin/bash
# Spock Bi-Directional Replication Setup Script
# This script automates the complete Spock setup including the manual fixes
# Run this AFTER both databases are up and healthy
#
# Usage: ./spock-setup.sh <local_node_name> <remote_host> <remote_port>
# Example: ./spock-setup.sh primary host.docker.internal 12532

set -e

LOCAL_NODE_NAME=${1:-primary}
REMOTE_HOST=${2:-host.docker.internal}
REMOTE_PORT=${3:-5432}
REPLICATION_PASSWORD=${REPLICATION_PASSWORD:-spock_replication_password_change_me}

# Determine remote node name (opposite of local)
if [ "$LOCAL_NODE_NAME" = "primary" ]; then
    REMOTE_NODE_NAME="standby"
    SUB_NAME="sub_from_standby"
else
    REMOTE_NODE_NAME="primary"
    SUB_NAME="sub_from_primary"
fi

LOCAL_DSN="host=localhost port=5432 dbname=postgres user=spock_replicator password=$REPLICATION_PASSWORD"
REMOTE_DSN="host=$REMOTE_HOST port=$REMOTE_PORT dbname=postgres user=spock_replicator password=$REPLICATION_PASSWORD"

echo "=== Spock Bi-Directional Replication Setup ==="
echo "Local node: $LOCAL_NODE_NAME"
echo "Remote node: $REMOTE_NODE_NAME"
echo "Remote DSN: host=$REMOTE_HOST port=$REMOTE_PORT"
echo ""

# Step 1: Create local node if not exists
echo "Step 1: Creating local node '$LOCAL_NODE_NAME'..."
psql -v ON_ERROR_STOP=1 -U supabase_admin -d postgres <<EOSQL
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM spock.node WHERE node_name = '$LOCAL_NODE_NAME') THEN
        PERFORM spock.node_create(
            node_name := '$LOCAL_NODE_NAME',
            dsn := '$LOCAL_DSN'
        );
        RAISE NOTICE 'Created local node: $LOCAL_NODE_NAME';
    ELSE
        RAISE NOTICE 'Local node already exists: $LOCAL_NODE_NAME';
    END IF;
END
\$\$;
EOSQL

# Get local node ID
LOCAL_NODE_ID=$(psql -U supabase_admin -d postgres -tAc "SELECT node_id FROM spock.node WHERE node_name = '$LOCAL_NODE_NAME';")
echo "Local node ID: $LOCAL_NODE_ID"

# Step 2: Test connectivity to remote
echo ""
echo "Step 2: Testing connectivity to remote node..."
if psql "$REMOTE_DSN" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "Successfully connected to remote node"
else
    echo "ERROR: Cannot connect to remote node at $REMOTE_HOST:$REMOTE_PORT"
    echo "Make sure the remote database is running and accessible"
    exit 1
fi

# Get remote node ID
REMOTE_NODE_ID=$(psql "$REMOTE_DSN" -tAc "SELECT node_id FROM spock.node WHERE node_name = '$REMOTE_NODE_NAME';" 2>/dev/null || echo "")
if [ -z "$REMOTE_NODE_ID" ]; then
    echo "WARNING: Remote node '$REMOTE_NODE_NAME' not yet created on remote server"
    echo "Run this script on the remote server first, then re-run here"
    exit 1
fi
echo "Remote node ID: $REMOTE_NODE_ID"

# Step 3: Add remote node reference locally
echo ""
echo "Step 3: Adding remote node reference..."
psql -v ON_ERROR_STOP=1 -U supabase_admin -d postgres <<EOSQL
INSERT INTO spock.node (node_id, node_name)
SELECT $REMOTE_NODE_ID, '$REMOTE_NODE_NAME'
WHERE NOT EXISTS (SELECT 1 FROM spock.node WHERE node_name = '$REMOTE_NODE_NAME');
EOSQL

# Step 4: Add interface to reach remote node
echo ""
echo "Step 4: Adding interface for remote node..."
psql -v ON_ERROR_STOP=1 -U supabase_admin -d postgres <<EOSQL
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM spock.node_interface WHERE if_name = '$REMOTE_NODE_NAME') THEN
        PERFORM spock.node_add_interface(
            node_name := '$REMOTE_NODE_NAME',
            interface_name := '$REMOTE_NODE_NAME',
            dsn := '$REMOTE_DSN'
        );
        RAISE NOTICE 'Added interface for remote node';
    ELSE
        RAISE NOTICE 'Interface already exists';
    END IF;
END
\$\$;
EOSQL

# Step 5: Create subscription if not exists
echo ""
echo "Step 5: Creating subscription '$SUB_NAME'..."
SUB_EXISTS=$(psql -U supabase_admin -d postgres -tAc "SELECT COUNT(*) FROM spock.subscription WHERE sub_name = '$SUB_NAME';")
if [ "$SUB_EXISTS" = "0" ]; then
    SUB_ID=$(psql -U supabase_admin -d postgres -tAc "SELECT spock.sub_create(
        subscription_name := '$SUB_NAME',
        provider_dsn := '$REMOTE_DSN',
        replication_sets := ARRAY['default', 'ddl_sql'],
        synchronize_structure := false,
        synchronize_data := false
    );")
    echo "Created subscription with ID: $SUB_ID"
else
    SUB_ID=$(psql -U supabase_admin -d postgres -tAc "SELECT sub_id FROM spock.subscription WHERE sub_name = '$SUB_NAME';")
    echo "Subscription already exists with ID: $SUB_ID"
fi

# Validate SUB_ID
SUB_ID=$(echo "$SUB_ID" | tr -d '[:space:]')
if [ -z "$SUB_ID" ] || ! echo "$SUB_ID" | grep -qE '^[0-9]+$'; then
    echo "ERROR: Failed to create or find subscription '$SUB_NAME'"
    echo "SUB_ID returned: '$SUB_ID'"
    echo "Check spock extension status and remote DSN: $REMOTE_DSN"
    exit 1
fi

# Get subscription slot name
SLOT_NAME=$(psql -U supabase_admin -d postgres -tAc "SELECT sub_slot_name FROM spock.subscription WHERE sub_id = $SUB_ID;")
SLOT_NAME=$(echo "$SLOT_NAME" | tr -d '[:space:]')
if [ -z "$SLOT_NAME" ]; then
    echo "ERROR: Could not find slot name for subscription ID $SUB_ID"
    exit 1
fi
echo "Slot name: $SLOT_NAME"

# Step 6: Spock replication workarounds (may not be needed for 5.x)
echo ""
echo "Step 6: Applying Spock replication workarounds (may not be needed for 5.x)..."

# Create replication origin locally
echo "Creating replication origin locally..."
psql -v ON_ERROR_STOP=1 -U supabase_admin -d postgres <<EOSQL
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_replication_origin WHERE roname = '$SLOT_NAME') THEN
        PERFORM pg_replication_origin_create('$SLOT_NAME');
        RAISE NOTICE 'Created replication origin: $SLOT_NAME';
    ELSE
        RAISE NOTICE 'Replication origin already exists';
    END IF;
END
\$\$;
EOSQL

# Update sync status to READY
echo "Updating sync status to READY..."
psql -v ON_ERROR_STOP=1 -U supabase_admin -d postgres <<EOSQL
UPDATE spock.local_sync_status
SET sync_status = 'r', sync_statuslsn = '0/0'
WHERE sync_subid = $SUB_ID AND sync_status != 'r';
EOSQL

# Create replication slot on remote (provider)
echo "Creating replication slot on remote provider..."
SLOT_EXISTS=$(psql "$REMOTE_DSN" -tAc "SELECT COUNT(*) FROM pg_replication_slots WHERE slot_name = '$SLOT_NAME';")
if [ "$SLOT_EXISTS" = "0" ]; then
    psql "$REMOTE_DSN" -c "SELECT pg_create_logical_replication_slot('$SLOT_NAME', 'spock_output');"
    echo "Created replication slot on remote"
else
    echo "Replication slot already exists on remote"
fi

# Step 7: Restart subscription
echo ""
echo "Step 7: Restarting subscription..."
psql -U supabase_admin -d postgres -c "SELECT spock.sub_disable('$SUB_NAME');" > /dev/null
psql -U supabase_admin -d postgres -c "SELECT spock.sub_enable('$SUB_NAME');" > /dev/null

# Wait for subscription to come up (poll with timeout instead of fixed sleep)
echo "Waiting for subscription to start..."
TIMEOUT=30
ELAPSED=0
STATUS=""
while [ $ELAPSED -lt $TIMEOUT ]; do
    STATUS=$(psql -U supabase_admin -d postgres -tAc "SELECT status FROM spock.sub_show_status() WHERE subscription_name = '$SUB_NAME';" 2>/dev/null | tr -d '[:space:]')
    if [ "$STATUS" = "replicating" ]; then
        break
    fi
    sleep 2
    ELAPSED=$((ELAPSED + 2))
done

# Step 8: Verify status
echo ""
echo "Step 8: Verifying subscription status..."
echo "Subscription status: $STATUS"

if [ "$STATUS" = "replicating" ]; then
    echo ""
    echo "=== SUCCESS: Subscription is replicating! ==="
else
    echo ""
    echo "=== WARNING: Subscription status is '$STATUS' ==="
    echo "Check logs for errors: docker logs <container_name> 2>&1 | grep spock"
fi

echo ""
echo "Setup complete for node '$LOCAL_NODE_NAME'"
