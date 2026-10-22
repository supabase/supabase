import { isFeatureEnabled } from 'common/enabled-features'

import type { NavMenuConstant } from '@/components/Navigation/Navigation.types'
import { navDataForMdx } from '@/components/Navigation/NavigationMenu/NavigationMenu.constants'

const { docsFdw: fdwEnabled, docsPgtap: pgTapEnabled } = isFeatureEnabled([
  'docs:fdw',
  'docs:pgtap',
])

export const database: NavMenuConstant = {
  icon: 'database',
  title: 'Database',
  url: '/guides/database/overview',
  items: [
    {
      name: 'Connect to your database',
      items: [
        { name: 'Overview', url: '/guides/database/connecting-to-postgres' },
        {
          name: 'Connection pooling and limits',
          items: [
            {
              name: 'Overview',
              url: '/guides/database/connecting-to-postgres/pooling-and-limits',
            },
            { name: 'Supavisor', url: '/guides/database/supavisor' },
            { name: 'Managing connections', url: '/guides/database/connection-management' },
          ],
        },
        {
          name: 'Serverless drivers',
          url: '/guides/database/connecting-to-postgres/serverless-drivers',
        },
        {
          name: 'ORM Quickstarts',
          items: [
            { name: 'Connecting with Prisma', url: '/guides/database/prisma' },
            {
              name: 'Prisma troubleshooting',
              url: '/guides/database/prisma/prisma-troubleshooting',
            },
            { name: 'Drizzle', url: '/guides/database/drizzle' },
            { name: 'Postgres.js', url: '/guides/database/postgres-js' },
          ],
        },
        navDataForMdx.guiQuickstarts,
        {
          name: 'Temporary access with Supabase user tokens',
          url: '/guides/platform/temporary-access',
        },
      ],
    },
    {
      name: 'Tables, data and functions',
      items: [
        { name: 'Managing tables and data', url: '/guides/database/tables' },
        { name: 'Views', url: '/guides/database/views' },
        { name: 'Managing indexes', url: '/guides/database/postgres/indexes' },
        {
          name: 'Querying and search',
          items: [
            { name: 'Querying joins and nested tables', url: '/guides/database/joins-and-nesting' },
            { name: 'Using Full Text Search', url: '/guides/database/full-text-search' },
            {
              name: 'PGroonga: multilingual full text search',
              url: '/guides/database/extensions/pgroonga',
            },
            {
              name: 'Select First Row per Group',
              url: '/guides/database/postgres/first-row-in-group',
            },
          ],
        },
        {
          name: 'Arrays, JSON and enums',
          items: [
            { name: 'Working with arrays', url: '/guides/database/arrays' },
            { name: 'JSON and unstructured data', url: '/guides/database/json' },
            { name: 'Managing enums', url: '/guides/database/postgres/enums' },
          ],
        },
        {
          name: 'Import and delete data',
          items: [
            { name: 'Importing data', url: '/guides/database/import-data' },
            {
              name: 'Migrate data from Firestore',
              url: '/guides/platform/migrating-to-supabase/firestore-data',
            },
            {
              name: 'Implementing cascade deletes',
              url: '/guides/database/postgres/cascade-deletes',
            },
            {
              name: 'Deleting data and dropping objects safely',
              url: '/guides/database/postgres/data-deletion',
            },
            {
              name: 'Drop All Tables in Schema',
              url: '/guides/database/postgres/dropping-all-tables-in-schema',
            },
          ],
        },
        {
          name: 'Functions and triggers',
          items: [
            { name: 'Debugging database functions', url: '/guides/database/debugging-functions' },
            { name: 'Managing database triggers', url: '/guides/database/postgres/triggers' },
            { name: 'Managing event triggers', url: '/guides/database/postgres/event-triggers' },
            { name: 'Managing database webhooks', url: '/guides/database/webhooks' },
          ],
        },
      ],
    },
    {
      name: 'Row Level Security, roles and Vault',
      items: [
        { name: 'Securing your data', url: '/guides/database/secure-data' },
        { name: 'Row Level Security', url: '/guides/database/postgres/row-level-security' },
        {
          name: 'Row Level Security Performance',
          url: '/guides/database/postgres/row-level-security-performance',
        },
        { name: 'Column Level Security', url: '/guides/database/postgres/column-level-security' },
        {
          name: 'Postgres roles',
          items: [
            { name: 'Overview', url: '/guides/database/postgres/roles' },
            {
              name: 'Superuser Access and Unsupported Operations',
              url: '/guides/database/postgres/roles-superuser',
            },
            { name: 'Default platform permissions', url: '/guides/platform/permissions' },
          ],
        },
        { name: 'Managing secrets with Vault', url: '/guides/database/vault' },
        {
          name: 'Test RLS policies with pgTAP',
          url: '/guides/local-development/testing/overview#database-unit-testing-with-pgtap',
        },
      ],
    },
    {
      name: 'Performance and debugging',
      items: [
        {
          name: 'Postgres configuration',
          items: [
            { name: 'Database configuration', url: '/guides/database/postgres/configuration' },
            { name: 'Customizing Postgres config', url: '/guides/database/custom-postgres-config' },
            {
              name: 'Postgres log configuration',
              url: '/guides/database/postgres/postgres-log-config',
            },
            { name: 'Timeouts', url: '/guides/database/postgres/timeouts' },
          ],
        },
        {
          name: 'Query performance',
          items: [
            { name: 'Query optimization', url: '/guides/database/query-optimization' },
            {
              name: 'Debugging performance issues',
              url: '/guides/database/debugging-performance',
            },
            { name: 'Partitioning your tables', url: '/guides/database/partitions' },
            { name: 'Migrating to pg_partman', url: '/guides/database/migrating-to-pg-partman' },
          ],
        },
        {
          name: 'Debugging and troubleshooting',
          items: [
            { name: 'Inspect the database', url: '/guides/observability/inspect' },
            { name: 'Troubleshooting', url: '/guides/database/troubleshooting' },
            {
              name: 'Print Postgres Version',
              url: '/guides/database/postgres/which-version-of-postgres',
            },
          ],
        },
        {
          name: 'Testing',
          items: [
            { name: 'Testing your database', url: '/guides/database/testing' },
            {
              name: 'pgTAP advanced guide',
              url: '/guides/local-development/testing/pgtap-extended',
              enabled: pgTapEnabled,
            },
          ],
        },
        {
          name: 'OrioleDB and Multigres',
          items: [
            { name: 'OrioleDB', url: '/guides/database/orioledb' },
            { name: 'Multigres', url: '/guides/database/multigres' },
            { name: 'Multigres compatibility', url: '/guides/database/multigres/compatibility' },
          ],
        },
      ],
    },
    {
      name: 'Database replication',
      items: [
        { name: 'Overview', url: '/guides/database/replication' },
        {
          name: 'Pipelines',
          items: [
            { name: 'Setting up pipelines', url: '/guides/database/replication/pipelines' },
            { name: 'BigQuery', url: '/guides/database/replication/pipelines/bigquery' },
            { name: 'ClickHouse', url: '/guides/database/replication/pipelines/clickhouse' },
            { name: 'DuckLake', url: '/guides/database/replication/pipelines/ducklake' },
            { name: 'Snowflake', url: '/guides/database/replication/pipelines/snowflake' },
            {
              name: 'Monitoring pipelines',
              url: '/guides/database/replication/pipelines-monitoring',
            },
            { name: 'Pipelines FAQ', url: '/guides/database/replication/pipelines-faq' },
          ],
        },
        {
          name: 'Manual replication',
          items: [
            {
              name: 'Setting up manual replication',
              url: '/guides/database/replication/manual-replication-setup',
            },
            {
              name: 'Monitoring manual replication',
              url: '/guides/database/replication/manual-replication-monitoring',
            },
            {
              name: 'Manual replication FAQ',
              url: '/guides/database/replication/manual-replication-faq',
            },
          ],
        },
        {
          name: 'Replicating from Supabase to External Postgres',
          url: '/guides/database/postgres/setup-replication-external',
        },
        {
          name: 'Read Replicas',
          items: [
            { name: 'Overview', url: '/guides/platform/read-replicas' },
            { name: 'Getting started', url: '/guides/platform/read-replicas/getting-started' },
          ],
        },
      ],
    },
    {
      name: 'Extensions',
      items: [
        { name: 'Overview', url: '/guides/database/extensions' },
        {
          name: 'Performance and monitoring',
          items: [
            { name: 'HypoPG: Hypothetical indexes', url: '/guides/database/extensions/hypopg' },
            {
              name: 'index_advisor: Query optimization',
              url: '/guides/database/extensions/index_advisor',
            },
            {
              name: 'pg_stat_statements: SQL Planning and Execution Statistics',
              url: '/guides/database/extensions/pg_stat_statements',
            },
            {
              name: 'pg_plan_filter: Restrict Total Cost',
              url: '/guides/database/extensions/pg_plan_filter',
            },
            {
              name: 'pg_repack: Storage Optimization',
              url: '/guides/database/extensions/pg_repack',
            },
          ],
        },
        {
          name: 'Search, vectors and geospatial',
          items: [
            {
              name: 'RUM: inverted index for full-text search',
              url: '/guides/database/extensions/rum',
            },
            {
              name: 'pgvector: Embeddings and vector similarity',
              url: '/guides/database/extensions/pgvector',
            },
            { name: 'PostGIS: Geo queries', url: '/guides/database/extensions/postgis' },
            {
              name: 'pgRouting: Geospatial Routing',
              url: '/guides/database/extensions/pgrouting',
            },
          ],
        },
        {
          name: 'HTTP and GraphQL',
          items: [
            { name: 'http: RESTful Client', url: '/guides/database/extensions/http' },
            { name: 'pg_net: Async Networking', url: '/guides/database/extensions/pg_net' },
            {
              name: 'pg_graphql: GraphQL Support',
              url: '/guides/database/extensions/pg_graphql',
            },
          ],
        },
        {
          name: 'Scheduling, queues and partitioning',
          items: [
            {
              name: 'pg_cron: Schedule Recurring Jobs',
              url: '/guides/database/extensions/pg_cron',
            },
            { name: 'pgmq: Queues', url: '/guides/database/extensions/pgmq' },
            {
              name: 'pg_partman: Partition management',
              url: '/guides/database/extensions/pg_partman',
            },
            { name: 'timescaledb (deprecated)', url: '/guides/database/extensions/timescaledb' },
          ],
        },
        {
          name: 'Data types and IDs',
          items: [
            {
              name: 'pg_jsonschema: JSON Schema Validation',
              url: '/guides/database/extensions/pg_jsonschema',
            },
            { name: 'pg_hashids: Short UIDs', url: '/guides/database/extensions/pg_hashids' },
            { name: 'uuid-ossp: Unique Identifiers', url: '/guides/database/extensions/uuid-ossp' },
          ],
        },
        {
          name: 'Security and auditing',
          items: [
            { name: 'PGAudit: Postgres Auditing', url: '/guides/database/extensions/pgaudit' },
            {
              name: 'pgsodium (pending deprecation): Encryption Features',
              url: '/guides/database/extensions/pgsodium',
            },
            { name: 'pgjwt (deprecated)', url: '/guides/database/extensions/pgjwt' },
          ],
        },
        {
          name: 'Testing and procedural languages',
          items: [
            { name: 'pgTAP: Unit Testing', url: '/guides/database/extensions/pgtap' },
            {
              name: 'plpgsql_check: PL/pgSQL Linter',
              url: '/guides/database/extensions/plpgsql_check',
            },
            { name: 'plv8 (deprecated)', url: '/guides/database/extensions/plv8' },
          ],
        },
      ],
    },
    {
      name: 'Foreign Data Wrappers',
      enabled: fdwEnabled,
      items: [
        { name: 'Overview', url: '/guides/database/extensions/wrappers/overview' },
        {
          name: 'postgres_fdw: query another Postgres server',
          url: '/guides/database/extensions/postgres_fdw',
        },
        {
          name: 'Databases and warehouses',
          items: [
            { name: 'BigQuery', url: '/guides/database/extensions/wrappers/bigquery' },
            { name: 'ClickHouse', url: '/guides/database/extensions/wrappers/clickhouse' },
            { name: 'Cloudflare D1', url: '/guides/database/extensions/wrappers/cloudflare-d1' },
            { name: 'DuckDB', url: '/guides/database/extensions/wrappers/duckdb' },
            { name: 'AWS DynamoDB', url: '/guides/database/extensions/wrappers/dynamodb' },
            { name: 'Firebase', url: '/guides/database/extensions/wrappers/firebase' },
            { name: 'MongoDB', url: '/guides/database/extensions/wrappers/mongodb' },
            { name: 'MSSQL', url: '/guides/database/extensions/wrappers/mssql' },
            { name: 'MySQL', url: '/guides/database/extensions/wrappers/mysql' },
            { name: 'Redis', url: '/guides/database/extensions/wrappers/redis' },
            { name: 'Snowflake', url: '/guides/database/extensions/wrappers/snowflake' },
          ],
        },
        {
          name: 'Files and object storage',
          items: [
            { name: 'AWS S3', url: '/guides/database/extensions/wrappers/s3' },
            { name: 'AWS S3 Vectors', url: '/guides/database/extensions/wrappers/s3_vectors' },
            { name: 'Iceberg', url: '/guides/database/extensions/wrappers/iceberg' },
          ],
        },
        {
          name: 'Apps and APIs',
          items: [
            { name: 'Airtable', url: '/guides/database/extensions/wrappers/airtable' },
            { name: 'Auth0', url: '/guides/database/extensions/wrappers/auth0' },
            { name: 'AWS Cognito', url: '/guides/database/extensions/wrappers/cognito' },
            { name: 'Cal.com', url: '/guides/database/extensions/wrappers/cal' },
            { name: 'Calendly', url: '/guides/database/extensions/wrappers/calendly' },
            { name: 'Clerk', url: '/guides/database/extensions/wrappers/clerk' },
            { name: 'Gravatar', url: '/guides/database/extensions/wrappers/gravatar' },
            { name: 'HubSpot', url: '/guides/database/extensions/wrappers/hubspot' },
            { name: 'Infura', url: '/guides/database/extensions/wrappers/infura' },
            { name: 'Logflare', url: '/guides/database/extensions/wrappers/logflare' },
            { name: 'Notion', url: '/guides/database/extensions/wrappers/notion' },
            { name: 'OpenAPI', url: '/guides/database/extensions/wrappers/openapi' },
            { name: 'Orb', url: '/guides/database/extensions/wrappers/orb' },
            { name: 'Paddle', url: '/guides/database/extensions/wrappers/paddle' },
            { name: 'Shopify', url: '/guides/database/extensions/wrappers/shopify' },
            { name: 'Slack', url: '/guides/database/extensions/wrappers/slack' },
            { name: 'Stripe', url: '/guides/database/extensions/wrappers/stripe' },
          ],
        },
      ],
    },
  ],
}
