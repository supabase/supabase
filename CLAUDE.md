# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

postgres-meta is a RESTful API for managing PostgreSQL databases. It provides a normalized interface over the PostgreSQL system catalog, exposing database objects (tables, columns, functions, etc.) through a Fastify-based REST API. The library can be used both as a standalone server and as an npm package.

## Development Commands

### Development Server
```bash
npm run dev              # Start dev server with Docker DB (auto-cleans on exit)
npm run dev:code         # Start dev server without DB setup (if DB already running)
```

The dev server uses nodemon with ts-node/esm loader and pipes output through pino-pretty for readable logs.

### Building
```bash
npm run build           # Compile TypeScript + copy SQL files to dist/
npm run clean           # Remove dist/ and tsconfig.tsbuildinfo
npm run check           # Type-check without emitting files
```

Build process: TypeScript compilation (tsc) + copying `src/lib/sql/*.sql` files to `dist/lib/sql/` via cpy-cli.

### Testing
```bash
npm test                # Full test: db:clean -> db:run -> test:run -> db:clean
npm run test:run        # Run tests only (DB must be running)
npm run test:update     # Update test snapshots (runs db:clean -> db:run first)
```

Tests use Vitest with snapshot testing. Test files are split between `test/lib/` (library tests) and `test/server/` (API tests). All tests import from `test/index.test.ts` which orchestrates test execution.

**Important**: Tests require Docker. The test DB is managed via `test/db/docker-compose.yml` and runs on port 5432. Tests run sequentially (`maxConcurrency: 1`) and use `pool: 'forks'` to avoid memory issues.

### Database Management
```bash
npm run db:run          # Start test DB in Docker (detached, with healthcheck)
npm run db:clean        # Stop and remove test DB containers
```

### Type Generation
```bash
npm run gen:types:typescript    # Generate TypeScript types from DB schema
npm run gen:types:python        # Generate Python types (Pydantic models)
npm run gen:types:go            # Generate Go types
npm run gen:types:swift         # Generate Swift types (beta)

# With custom DB connection:
PG_META_DB_URL=postgresql://... npm run gen:types:typescript
```

Type generation is controlled by `PG_META_GENERATE_TYPES` env var and runs the server in special mode (exits after generating types to stdout).

### Code Quality
```bash
npm run format          # Format code with Prettier
```

## Architecture

### Two-Layer Design

1. **Library Layer** (`src/lib/`): Core PostgreSQL introspection logic
   - `PostgresMeta.ts`: Main class that aggregates all metadata managers
   - `PostgresMeta*.ts`: Individual managers for each database object type (columns, tables, functions, etc.)
   - `sql/*.sql.ts`: SQL query templates for fetching metadata from system catalogs
   - `Parser.ts`: SQL parsing, formatting, and deparsing (uses pgsql-parser)
   - `db.ts`: Connection pooling and query execution with error handling

2. **Server Layer** (`src/server/`): REST API built with Fastify
   - `server.ts`: Entry point, handles normal server mode + type generation mode
   - `app.ts`: Main Fastify app with routes, CORS, Swagger docs
   - `admin-app.ts`: Admin server (runs on PG_META_PORT + 1) for metrics
   - `routes/*.ts`: REST endpoints mapping to library methods
   - `routes/generators/*.ts`: Type generation endpoints backed by `@supabase/postgrest-typegen`

### Object Manager Pattern

Each PostgreSQL object type has a dedicated manager class following this pattern:
- `PostgresMetaTables`, `PostgresMetaColumns`, `PostgresMetaFunctions`, etc.
- Each manager has methods: `list()`, `retrieve()`, `create()`, `update()`, `remove()`
- Managers compose SQL from `src/lib/sql/*.sql.ts` templates
- All methods return `PostgresMetaResult<T>` = `{ data: T | null, error: Error | null }`

### SQL Query Organization

SQL queries are defined in `src/lib/sql/*.sql.ts` as TypeScript template literals:
- Queries use `pg-format` for safe parameterization
- Complex queries join against `pg_catalog` and `information_schema`
- Build process copies SQL files to `dist/lib/sql/` for runtime access

### Connection Pooling

- Uses custom `@supabase/pg` fork (v0.0.3) instead of standard `pg`
- Connection pool initialized in `db.ts` via `init(config)`
- Pool configuration supports:
  - `connectionTimeoutMillis`: Connection timeout (default 15s)
  - `query_timeout`: Query timeout (default 55s)
  - `maxResultSize`: Max result size in bytes (default 2GB, configurable via `PG_META_MAX_RESULT_SIZE_MB`)
  - SSL configuration via `PG_META_DB_SSL_ROOT_CERT`
- Custom error handling for `RESULT_SIZE_EXCEEDED` errors
- Pool auto-reconnects on connection errors by calling `pool.end()` and reinitializing

### Error Handling

Database errors are formatted to mimic `psql` output:
- Includes severity, error code, message, line number, position marker
- Position calculation accounts for injected `SET statement_timeout` prefix
- Returns structured errors: `{ code, message, formattedError, position, detail, hint }`

### Type Generation

Type generation (`npm run gen:types:*`) works by:
1. Connecting to a database (test DB or custom via `PG_META_DB_URL`)
2. Introspecting schemas, tables, columns, relationships, functions, and types via `@supabase/postgrest-typegen`'s `introspect()` (wrapped by `src/lib/generators.ts`)
3. Passing the metadata to the package's language generators (`generateTypescript`, `generateGo`, `generateSwift`, `generatePython`)
4. Generators output type definitions to stdout

Environment variables:
- `PG_META_GENERATE_TYPES`: Language (typescript, python, go, swift)
- `PG_META_GENERATE_TYPES_INCLUDED_SCHEMAS`: Comma-separated schemas to include
- `PG_META_GENERATE_TYPES_DETECT_ONE_TO_ONE_RELATIONSHIPS`: Enable 1:1 relationship detection
- `PG_META_POSTGREST_VERSION`: PostgREST version for TypeScript template compatibility

## Environment Variables

Required for server operation:
```bash
PG_META_HOST=0.0.0.0                    # Server host
PG_META_PORT=8080                       # Server port (admin runs on +1)
PG_META_DB_HOST=localhost               # PostgreSQL host
PG_META_DB_NAME=postgres                # Database name
PG_META_DB_USER=postgres                # Database user
PG_META_DB_PORT=5432                    # PostgreSQL port
PG_META_DB_PASSWORD=postgres            # Database password (or use CRYPTO_KEY for secrets)
PG_META_DB_SSL_MODE=disable             # SSL mode (disable, require, verify-full, etc.)
```

Alternative connection:
```bash
PG_META_DB_URL=postgresql://...         # Full connection string (overrides individual params)
```

Performance tuning:
```bash
PG_CONN_TIMEOUT_SECS=15                 # Connection timeout (default: 15)
PG_QUERY_TIMEOUT_SECS=55                # Query timeout (default: 55)
PG_META_MAX_RESULT_SIZE_MB=20           # Max query result size in MB (default: 2048MB)
PG_META_MAX_BODY_LIMIT_MB=3             # Max request body size in MB (default: 3MB)
PG_META_SHUTDOWN_GRACE_PERIOD_SECS=10   # Shutdown wait on in-flight work before force-exit (default: 10)
```

TypeScript generation on a worker thread (opt-in):
```bash
PG_META_FORMAT_IN_WORKER=true           # Generate TypeScript types on a worker thread (default: false)
PG_META_FORMAT_POOL_SIZE=1              # Worker threads used for generation (default: 1)
PG_META_FORMAT_MAX_QUEUE=20             # Max generation calls in flight before returning 503 (default: 20)
PG_META_FORMAT_TIMEOUT_SECS=60          # Per-generation timeout (default: 60)
PG_META_FORMAT_IDLE_TIMEOUT_SECS=30     # Idle time before a worker exits (default: 30)
```

`generateTypescript` is CPU-bound and synchronous: on a large schema it blocks
the event loop and the server cannot answer anything else, health checks
included. Formatting is the bulk of it (oxfmt since postgrest-typegen 0.2.0,
much faster than the prettier it replaced but still synchronous) and the string
building ahead of it costs too, so `PG_META_FORMAT_IN_WORKER=true` moves the
whole call to a worker thread (`src/server/format-pool.ts`). Metadata
crosses the thread boundary as a structured clone, which is plain JSON and does
not measurably change wall-clock time. Always off during type generation
(`PG_META_GENERATE_TYPES`), which generates once and exits.

The env vars keep their `PG_META_FORMAT_*` names from when the worker formatted
only, so existing deployments do not need reconfiguring.

## Testing Notes

### Snapshot Testing
Tests use Vitest inline snapshots (`toMatchInlineSnapshot`). When fixing bugs:
1. Add test case reproducing the bug
2. Fix the bug
3. Run `npm run test:update` (adds `-u` flag to vitest)
4. Review git diff of snapshots - `id` field changes are expected
5. Remove `-u` flag before committing (or use `npm run test` directly)

### Test Structure
- `test/lib/*.ts`: Direct library tests using `pgMeta` instance
- `test/server/*.ts`: HTTP API tests using Fastify test utils
- `test/index.test.ts`: Main entry point that imports all test modules
- `test/db/`: Docker Compose config for test database with SSL enabled

### Custom Database Connection
To test against a different database:
```bash
PG_META_DB_URL=postgresql://user:pass@host:port/dbname npm run dev:code
```

## Module System

This project uses **ESM** (ES Modules):
- `"type": "module"` in package.json
- Import statements use `.js` extension (TypeScript convention for ESM)
- Node >=20 required
- ts-node runs with `--loader ts-node/esm` flag
- Uses import attributes for JSON: `import pkg from '#package.json' with { type: 'json' }`

## Special Imports

The `#package.json` import is defined in package.json `imports` field:
```json
"imports": {
  "#package.json": "./package.json"
}
```

This allows importing package.json metadata in ESM without path resolution issues.

## OpenAPI Documentation

Generate OpenAPI spec:
```bash
npm run docs:export > openapi.json
```

Uses Fastify's `@fastify/swagger` plugin. Routes define schemas using `@sinclair/typebox` for automatic OpenAPI generation.
