import type { FederatedContentSource } from '../types'

// We fetch these docs at build time from an external repo
const wrappers: FederatedContentSource = {
  section: 'database/extensions/wrappers',
  org: 'supabase',
  repo: 'wrappers',
  branch: 'main',
  // The wrappers repo tags its docs releases separately from code.
  latestTag: { pattern: '^docs_v\\d+\\.\\d+\\.\\d+' },
  docsDir: 'docs/catalog',
  assetsDir: 'docs/assets',
  externalSite: 'https://supabase.github.io/wrappers',
  pageMap: [
    {
      slug: 'airtable',
      meta: {
        title: 'Airtable',
        description:
          'Set up the Airtable Wrapper to read data from Airtable bases and tables within your Postgres database using a foreign data wrapper.',
        dashboardIntegrationPath: 'airtable_wrapper',
      },
      remoteFile: 'airtable.md',
    },
    {
      slug: 'auth0',
      meta: {
        title: 'Auth0',
        description:
          'Set up the Auth0 Wrapper to read data from your Auth0 tenant within your Postgres database using a foreign data wrapper.',
        dashboardIntegrationPath: 'auth0_wrapper',
      },
      remoteFile: 'auth0.md',
    },
    {
      slug: 'bigquery',
      meta: {
        title: 'BigQuery',
        description:
          'Set up the BigQuery Wrapper to read and write BigQuery data from your Postgres database using a foreign data wrapper.',
        dashboardIntegrationPath: 'bigquery_wrapper',
      },
      remoteFile: 'bigquery.md',
    },
    {
      slug: 'cal',
      meta: {
        title: 'Cal.com',
        description:
          'Set up the Cal.com Wrapper, a WebAssembly foreign data wrapper, to read Cal.com scheduling data from your Postgres database.',
        dashboardIntegrationPath: 'cal_wrapper',
      },
      remoteFile: 'cal.md',
    },
    {
      slug: 'calendly',
      meta: {
        title: 'Calendly',
        description:
          'Set up the Calendly Wrapper, a WebAssembly foreign data wrapper, to read Calendly scheduling data from your Postgres database.',
        dashboardIntegrationPath: 'calendly_wrapper',
      },
      remoteFile: 'calendly.md',
    },
    {
      slug: 'clerk',
      meta: {
        title: 'Clerk',
        description:
          'Set up the Clerk Wrapper, a WebAssembly foreign data wrapper, to read Clerk data from your Postgres database.',
        dashboardIntegrationPath: 'clerk_wrapper',
      },
      remoteFile: 'clerk.md',
    },
    {
      slug: 'clickhouse',
      meta: {
        title: 'ClickHouse',
        description:
          'Set up the ClickHouse Wrapper to read and write ClickHouse data from your Postgres database using a foreign data wrapper.',
        dashboardIntegrationPath: 'clickhouse_wrapper',
      },
      remoteFile: 'clickhouse.md',
    },
    {
      slug: 'cloudflare-d1',
      meta: {
        title: 'Cloudflare D1',
        description:
          'Set up the Cloudflare D1 Wrapper, a WebAssembly foreign data wrapper, to read data from a Cloudflare D1 database within your Postgres database.',
        dashboardIntegrationPath: 'cfd1_wrapper',
      },
      remoteFile: 'cfd1.md',
    },
    {
      slug: 'cognito',
      meta: {
        title: 'AWS Cognito',
        description:
          'Set up the AWS Cognito Wrapper to read data from a Cognito user pool within your Postgres database using a foreign data wrapper.',
        dashboardIntegrationPath: 'cognito_wrapper',
      },
      remoteFile: 'cognito.md',
    },
    {
      slug: 'duckdb',
      meta: {
        title: 'DuckDB',
        description:
          'Set up the DuckDB Wrapper to read data from DuckDB within your Postgres database using a foreign data wrapper.',
      },
      remoteFile: 'duckdb.md',
    },
    {
      slug: 'dynamodb',
      meta: {
        title: 'AWS DynamoDB',
        description:
          'Set up the DynamoDB Wrapper to read and write AWS DynamoDB table data within your Postgres database using a foreign data wrapper.',
      },
      remoteFile: 'dynamodb.md',
    },
    {
      slug: 'firebase',
      meta: {
        title: 'Firebase',
        description:
          'Set up the Firebase Wrapper to read Firebase Authentication users and Firestore documents from your Postgres database.',
        dashboardIntegrationPath: 'firebase_wrapper',
      },
      remoteFile: 'firebase.md',
    },
    {
      slug: 'gravatar',
      meta: {
        title: 'Gravatar',
        description:
          'Set up the Gravatar Wrapper to read Gravatar profile data from your Postgres database, including versions and credential storage.',
      },
      remoteFile: 'gravatar.md',
    },
    {
      slug: 'hubspot',
      meta: {
        title: 'HubSpot',
        description:
          'Set up the HubSpot Wrapper to read HubSpot data from your Postgres database, including available versions and credential storage.',
        dashboardIntegrationPath: 'hubspot_wrapper',
      },
      remoteFile: 'hubspot.md',
    },
    {
      slug: 'iceberg',
      meta: {
        title: 'Iceberg',
        description:
          'Set up the Iceberg Wrapper to read from and write to Apache Iceberg tables from your Postgres database.',
        dashboardIntegrationPath: 'iceberg_wrapper',
      },
      remoteFile: 'iceberg.md',
    },
    {
      slug: 'infura',
      meta: {
        title: 'Infura',
        description:
          'Set up the Infura Wrapper to read blockchain data, such as blocks, transactions, balances, and logs, from your Postgres database.',
      },
      remoteFile: 'infura.md',
    },
    {
      slug: 'logflare',
      meta: {
        title: 'Logflare',
        description:
          'Set up the Logflare Wrapper to read data from Logflare endpoints in your Postgres database, including storing your API key in Vault.',
        dashboardIntegrationPath: 'logflare_wrapper',
      },
      remoteFile: 'logflare.md',
    },
    {
      slug: 'mongodb',
      meta: {
        title: 'MongoDB',
        description:
          'Set up the MongoDB Wrapper to read and write MongoDB documents from Postgres, and map top-level document fields to columns.',
      },
      remoteFile: 'mongodb.md',
    },
    {
      slug: 'mssql',
      meta: {
        title: 'MSSQL',
        description:
          'Set up the SQL Server Wrapper to read data from Microsoft SQL Server in your Postgres database, including storing your connection string in Vault.',
        dashboardIntegrationPath: 'mssql_wrapper',
      },
      remoteFile: 'mssql.md',
    },
    {
      slug: 'mysql',
      meta: {
        title: 'MySQL',
        description:
          'Set up the MySQL Wrapper to read and write MySQL data from your Postgres database, including storing your connection string in Vault.',
      },
      remoteFile: 'mysql.md',
    },
    {
      slug: 'notion',
      meta: {
        title: 'Notion',
        description:
          'Set up the Notion Wrapper to read data from a Notion workspace in your Postgres database, including available versions.',
        dashboardIntegrationPath: 'notion_wrapper',
      },
      remoteFile: 'notion.md',
    },
    {
      slug: 'openapi',
      meta: {
        title: 'OpenAPI',
        description:
          'Set up the OpenAPI Wrapper to query any REST API that has an OpenAPI 3.0 or later specification as Postgres foreign tables.',
      },
      remoteFile: 'openapi.md',
    },
    {
      slug: 'orb',
      meta: {
        title: 'Orb',
        description:
          'Set up the Orb Wrapper to read usage-based billing data from Orb in your Postgres database, including available versions.',
        dashboardIntegrationPath: 'orb_wrapper',
      },
      remoteFile: 'orb.md',
    },
    {
      slug: 'paddle',
      meta: {
        title: 'Paddle',
        description:
          'Set up the Paddle Wrapper to read and write Paddle payment data from your Postgres database, including available versions.',
        dashboardIntegrationPath: 'paddle_wrapper',
      },
      remoteFile: 'paddle.md',
    },
    {
      slug: 'redis',
      meta: {
        title: 'Redis',
        description:
          'Set up the Redis Wrapper to read data from Redis in your Postgres database, including storing your connection URL in Vault.',
        dashboardIntegrationPath: 'redis_wrapper',
      },
      remoteFile: 'redis.md',
    },
    {
      slug: 's3',
      meta: {
        title: 'AWS S3',
        description:
          'Set up the S3 Wrapper to read CSV, JSON Lines, and Parquet files stored in AWS S3 from your Postgres database.',
        dashboardIntegrationPath: 's3_wrapper',
      },
      remoteFile: 's3.md',
    },
    {
      slug: 's3_vectors',
      meta: {
        title: 'AWS S3 Vectors',
        description:
          'Set up the S3 Vectors Wrapper to read, write, and run vector similarity searches on AWS S3 Vectors from your Postgres database.',
        dashboardIntegrationPath: 's3_vectors_wrapper',
      },
      remoteFile: 's3vectors.md',
    },
    {
      slug: 'shopify',
      meta: {
        title: 'Shopify',
        description:
          'Set up the Shopify Wrapper to read store data from Shopify in your Postgres database, including available versions.',
      },
      remoteFile: 'shopify.md',
    },
    {
      slug: 'slack',
      meta: {
        title: 'Slack',
        description:
          'Set up the Slack Wrapper to query Slack workspaces, channels, messages, and users from your Postgres database.',
      },
      remoteFile: 'slack.md',
    },
    {
      slug: 'snowflake',
      meta: {
        title: 'Snowflake',
        description:
          'Set up the Snowflake Wrapper to read and write Snowflake data from your Postgres database, including available versions.',
        dashboardIntegrationPath: 'snowflake_wrapper',
      },
      remoteFile: 'snowflake.md',
    },
    {
      slug: 'stripe',
      meta: {
        title: 'Stripe',
        description:
          'Set up the Stripe Wrapper to read Stripe data from your Postgres database, including storing your API key in Vault.',
        dashboardIntegrationPath: 'stripe_wrapper',
      },
      remoteFile: 'stripe.md',
    },
  ],
}

export default wrappers
