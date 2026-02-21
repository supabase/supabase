# Self-Hosted Supabase with Docker

This is the official Docker Compose setup for self-hosted Supabase. It provides a complete stack with all Supabase services running locally or on your infrastructure.

## Getting Started

Follow the detailed setup guide in our documentation: [Self-Hosting with Docker](https://supabase.com/docs/guides/self-hosting/docker)

The guide covers:
- Prerequisites (Git and Docker)
- Initial setup and configuration
- Securing your installation
- Accessing services
- Updating your instance

## What's Included

This Docker Compose configuration includes the following services:

- **[Studio](https://github.com/supabase/supabase/tree/master/apps/studio)** - A dashboard for managing your self-hosted Supabase project
- **[Kong](https://github.com/Kong/kong)** - Kong API gateway
- **[Auth](https://github.com/supabase/auth)** - JWT-based authentication API for user sign-ups, logins, and session management
- **[PostgREST](https://github.com/PostgREST/postgrest)** - Web server that turns your PostgreSQL database directly into a RESTful API
- **[Realtime](https://github.com/supabase/realtime)** - Elixir server that listens to PostgreSQL database changes and broadcasts them over websockets
- **[Storage](https://github.com/supabase/storage)** - RESTful API for managing files in S3, with Postgres handling permissions
- **[imgproxy](https://github.com/imgproxy/imgproxy)** - Fast and secure image processing server
- **[postgres-meta](https://github.com/supabase/postgres-meta)** - RESTful API for managing Postgres (fetch tables, add roles, run queries)
- **[PostgreSQL](https://github.com/supabase/postgres)** - Object-relational database with over 30 years of active development
- **[Spock](https://github.com/pgEdge/spock)** - Multi-master bi-directional logical replication for PostgreSQL
- **[Snowflake](https://github.com/pgEdge/snowflake)** - Distributed unique ID generator (Twitter Snowflake-style) for conflict-free multi-node primary keys
- **[Edge Runtime](https://github.com/supabase/edge-runtime)** - Web server based on Deno runtime for running JavaScript, TypeScript, and WASM services
- **[Logflare](https://github.com/Logflare/logflare)** - Log management and event analytics platform
- **[Vector](https://github.com/vectordotdev/vector)** - High-performance observability data pipeline for logs
- **[Supavisor](https://github.com/supabase/supavisor)** - Supabase's Postgres connection pooler

## Documentation

- **[Documentation](https://supabase.com/docs/guides/self-hosting/docker)** - Setup and configuration guides
- **[CHANGELOG.md](./CHANGELOG.md)** - Track recent updates and changes to services
- **[versions.md](./versions.md)** - Complete history of Docker image versions for rollback reference

## Updates

To update your self-hosted Supabase instance:

1. Review [CHANGELOG.md](./CHANGELOG.md) for breaking changes
2. Check [versions.md](./versions.md) for new image versions
3. Update `docker-compose.yml` if there are configuration changes
4. Pull the latest images: `docker compose pull`
5. Stop services: `docker compose down`
6. Start services with new configuration: `docker compose up -d`

**Note:** Consider to always backup your database before updating.

## Community & Support

For troubleshooting common issues, see:
- [GitHub Discussions](https://github.com/orgs/supabase/discussions?discussions_q=is%3Aopen+label%3Aself-hosted) - Questions, feature requests, and workarounds
- [GitHub Issues](https://github.com/supabase/supabase/issues?q=is%3Aissue%20state%3Aopen%20label%3Aself-hosted) - Known issues
- [Documentation](https://supabase.com/docs/guides/self-hosting) - Setup and configuration guides

Self-hosted Supabase is community-supported. Get help and connect with other users:

- [Discord](https://discord.supabase.com) - Real-time chat and community support
- [Reddit](https://www.reddit.com/r/Supabase/) - Official Supabase subreddit

Share your self-hosting experience:

- [GitHub Discussions](https://github.com/orgs/supabase/discussions/39820) - "Self-hosting: What's working (and what's not)?"

## Important Notes

### Security

⚠️ **The default configuration is not secure for production use.**

Before deploying to production, you must:
- Update all default passwords and secrets in the `.env` file
- Generate new JWT secrets
- Review and update CORS settings
- Consider setting up a secure proxy in front of self-hosted Supabase
- Review and adjust network security configuration (ACLs, etc.)
- Set up proper backup procedures

See the [security section](https://supabase.com/docs/guides/self-hosting/docker#configuring-and-securing-supabase) in the documentation.

## Bi-Directional Replication with Spock

This Docker setup uses a custom PostgreSQL image that includes [Spock 5.0.4](https://github.com/pgEdge/spock) for bi-directional logical replication and [Snowflake](https://github.com/pgEdge/snowflake) for distributed unique ID generation. This enables active-active replication between two or more Supabase instances.

### How It Works

- **Spock** replicates DML (INSERT, UPDATE, DELETE) and DDL (CREATE TABLE, ALTER TABLE, etc.) automatically between nodes
- **Snowflake** generates globally unique 64-bit IDs using a node-specific identifier, eliminating primary key conflicts across nodes
- A replication user (`spock_replicator`) is created automatically
- pg_hba.conf is pre-configured to allow replication connections
- An event trigger automatically adds new tables to the `default` replication set

### Snowflake IDs

Each node must have a unique `SNOWFLAKE_NODE` value (1-1023) set in `.env`. This is used to generate globally unique bigint IDs across all nodes, replacing the need for sequence offsets or UUIDs.

```sql
-- Use snowflake IDs as primary keys
CREATE TABLE public.my_table (
    id bigint DEFAULT snowflake.nextval('snowflake.id_seq') PRIMARY KEY,
    name text
);

-- Generate an ID manually
SELECT snowflake.nextval('snowflake.id_seq');
-- Returns: 413334082185859072

-- Extract the originating node from any ID
SELECT snowflake.get_node(413334082185859072);
-- Returns: 1
```

### DDL Replication

Spock 5.0.4 automatically replicates DDL statements between nodes. Standard SQL like `CREATE TABLE`, `ALTER TABLE`, and `DROP TABLE` will replicate without any special wrapping:

```sql
-- Just run normal DDL on any node - it replicates automatically
CREATE TABLE public.users (
    id bigint DEFAULT snowflake.nextval('snowflake.id_seq') PRIMARY KEY,
    name text
);

ALTER TABLE public.users ADD COLUMN email text;
```

This requires the following settings in `postgresql-spock.conf` (pre-configured):
```conf
spock.enable_ddl_replication = on
spock.include_ddl_repset = on
spock.allow_ddl_from_functions = on
```

For edge cases where automatic capture doesn't work, you can use explicit replication:
```sql
SELECT spock.replicate_ddl('CREATE TABLE public.my_table (id bigint PRIMARY KEY)');
```

### Setting Up Bi-Directional Replication

For two Supabase instances on separate servers (e.g., PRIMARY and STANDBY):

1. **Configure both instances** with different `.env` values:
   - Unique `SNOWFLAKE_NODE` per instance (e.g., `1` for primary, `2` for standby)
   - Update `REPLICATION_PASSWORD` from the default (must match on both nodes)
   - Ensure each node's PostgreSQL port is accessible from the other node

2. **Start both instances**:
   ```bash
   # On primary server
   docker compose up -d

   # On standby server
   docker compose up -d
   ```

3. **Run the setup script** (requires two passes since each node must exist before the other can subscribe):
   ```bash
   # Pass 1: Run on PRIMARY - creates the primary node, then exits
   # because the standby node doesn't exist yet (this is expected)
   docker exec supabase-db /spock-setup.sh primary <standby-host> <standby-port>

   # Pass 2: Run on STANDBY - creates the standby node, finds primary,
   # creates subscription (succeeds)
   docker exec supabase-db /spock-setup.sh standby <primary-host> <primary-port>

   # Pass 3: Re-run on PRIMARY - now finds the standby node,
   # creates subscription (succeeds)
   docker exec supabase-db /spock-setup.sh primary <standby-host> <standby-port>
   ```

   The `<host>` and `<port>` values should point to the other node's PostgreSQL instance. If both databases are on the same Docker network, use the container name as the host. For cross-network setups, use the appropriate hostname/IP and port.

4. **Verify replication**:
   ```sql
   -- Check subscription status on each node
   SELECT * FROM spock.sub_show_status();
   -- status should be "replicating"

   -- Test: insert on one node, verify it appears on the other
   INSERT INTO my_table (name) VALUES ('test from primary');
   ```

### Secure Cross-Network Replication with Cloudflare Tunnels

If your nodes are on different networks (e.g., different data centers or cloud providers), you need a secure way for each node to reach the other's PostgreSQL port. [Cloudflare Tunnels](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) are a good option — they provide encrypted connectivity without exposing database ports to the public internet.

**How it works:**

Each server runs a Cloudflare tunnel that exposes its local PostgreSQL port to a private hostname. The other server runs a `cloudflared access` client that connects to that hostname and makes it available locally.

```text
PRIMARY (server-a)                          STANDBY (server-b)
┌─────────────────────┐                     ┌─────────────────────┐
│ supabase-db (:5432) │                     │ supabase-db (:5432) │
│         ↑           │                     │         ↑           │
│ cloudflared tunnel  │──── Cloudflare ────│ cloudflared access  │
│ (exposes :5432 as   │     Network         │ (pg-primary:35432)  │
│  pg-primary.example)│                     │                     │
│                     │                     │                     │
│ cloudflared access  │──── Cloudflare ────│ cloudflared tunnel  │
│ (pg-standby:35432)  │     Network         │ (exposes :5432 as   │
│                     │                     │  pg-standby.example) │
└─────────────────────┘                     └─────────────────────┘
```

**Setup on each server:**

1. [Create a Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/get-started/) that points a private hostname to `tcp://localhost:<db-port>` (e.g., `pg-primary.example.com` → `tcp://localhost:5432`)

2. On the **other** server, run a `cloudflared access` client to make the remote database available locally:
   ```bash
   # Example: on STANDBY, connect to PRIMARY's tunnel
   docker run -d --name cloudflared-pg-replication \
     --network supabase_default \
     --restart unless-stopped \
     cloudflare/cloudflared:latest \
     access tcp --hostname pg-primary.example.com --url 0.0.0.0:35432
   ```

3. Use the `cloudflared access` container as the host in the spock setup:
   ```bash
   # On STANDBY — the cloudflared container is on the same Docker network
   docker exec supabase-db /spock-setup.sh standby cloudflared-pg-replication 35432
   ```

   If the `cloudflared access` client runs as a system service instead of a Docker container, use `host.docker.internal` as the host so the database container can reach it.

### Important Notes

- **Unique node IDs**: Every node **must** have a unique `SNOWFLAKE_NODE` value (1-1023) in `.env`
- **DDL replication**: DDL auto-replicates with Spock 5.0.4 — no manual wrapping needed
- **Auto repset**: New tables are automatically added to the `default` replication set via event trigger
- **No sequence conflicts**: Snowflake IDs embed the node ID, so IDs are globally unique without any sequence coordination
- **Change the default password**: You **must** update `REPLICATION_PASSWORD` in `.env` before exposing the database to any network. The default password is insecure

### Disabling Replication

If you don't need replication, you can use this setup as a standard Supabase installation. The Spock extension is installed but inactive until you run the setup script. Snowflake IDs still work as a convenient distributed-safe ID generator even without replication.

## License

This repository is licensed under the Apache 2.0 License. See the main [Supabase repository](https://github.com/supabase/supabase) for details.
