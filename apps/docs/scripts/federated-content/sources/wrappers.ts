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
      meta: { title: 'Airtable', dashboardIntegrationPath: 'airtable_wrapper' },
      remoteFile: 'airtable.md',
    },
    {
      slug: 'auth0',
      meta: { title: 'Auth0', dashboardIntegrationPath: 'auth0_wrapper' },
      remoteFile: 'auth0.md',
    },
    {
      slug: 'bigquery',
      meta: { title: 'BigQuery', dashboardIntegrationPath: 'bigquery_wrapper' },
      remoteFile: 'bigquery.md',
    },
    {
      slug: 'cal',
      meta: { title: 'Cal.com', dashboardIntegrationPath: 'cal_wrapper' },
      remoteFile: 'cal.md',
    },
    {
      slug: 'calendly',
      meta: { title: 'Calendly', dashboardIntegrationPath: 'calendly_wrapper' },
      remoteFile: 'calendly.md',
    },
    {
      slug: 'clerk',
      meta: { title: 'Clerk', dashboardIntegrationPath: 'clerk_wrapper' },
      remoteFile: 'clerk.md',
    },
    {
      slug: 'clickhouse',
      meta: { title: 'ClickHouse', dashboardIntegrationPath: 'clickhouse_wrapper' },
      remoteFile: 'clickhouse.md',
    },
    {
      slug: 'cloudflare-d1',
      meta: { title: 'Cloudflare D1', dashboardIntegrationPath: 'cfd1_wrapper' },
      remoteFile: 'cfd1.md',
    },
    {
      slug: 'cognito',
      meta: { title: 'AWS Cognito', dashboardIntegrationPath: 'cognito_wrapper' },
      remoteFile: 'cognito.md',
    },
    {
      slug: 'duckdb',
      meta: { title: 'DuckDB' },
      remoteFile: 'duckdb.md',
    },
    {
      slug: 'dynamodb',
      meta: { title: 'AWS DynamoDB' },
      remoteFile: 'dynamodb.md',
    },
    {
      slug: 'firebase',
      meta: { title: 'Firebase', dashboardIntegrationPath: 'firebase_wrapper' },
      remoteFile: 'firebase.md',
    },
    {
      slug: 'gravatar',
      meta: { title: 'Gravatar' },
      remoteFile: 'gravatar.md',
    },
    {
      slug: 'hubspot',
      meta: { title: 'HubSpot', dashboardIntegrationPath: 'hubspot_wrapper' },
      remoteFile: 'hubspot.md',
    },
    {
      slug: 'iceberg',
      meta: { title: 'Iceberg', dashboardIntegrationPath: 'iceberg_wrapper' },
      remoteFile: 'iceberg.md',
    },
    {
      slug: 'infura',
      meta: { title: 'Infura' },
      remoteFile: 'infura.md',
    },
    {
      slug: 'logflare',
      meta: { title: 'Logflare', dashboardIntegrationPath: 'logflare_wrapper' },
      remoteFile: 'logflare.md',
    },
    {
      slug: 'mongodb',
      meta: { title: 'MongoDB' },
      remoteFile: 'mongodb.md',
    },
    {
      slug: 'mssql',
      meta: { title: 'MSSQL', dashboardIntegrationPath: 'mssql_wrapper' },
      remoteFile: 'mssql.md',
    },
    {
      slug: 'mysql',
      meta: { title: 'MySQL' },
      remoteFile: 'mysql.md',
    },
    {
      slug: 'notion',
      meta: { title: 'Notion', dashboardIntegrationPath: 'notion_wrapper' },
      remoteFile: 'notion.md',
    },
    {
      slug: 'openapi',
      meta: { title: 'OpenAPI' },
      remoteFile: 'openapi.md',
    },
    {
      slug: 'orb',
      meta: { title: 'Orb', dashboardIntegrationPath: 'orb_wrapper' },
      remoteFile: 'orb.md',
    },
    {
      slug: 'paddle',
      meta: { title: 'Paddle', dashboardIntegrationPath: 'paddle_wrapper' },
      remoteFile: 'paddle.md',
    },
    {
      slug: 'redis',
      meta: { title: 'Redis', dashboardIntegrationPath: 'redis_wrapper' },
      remoteFile: 'redis.md',
    },
    {
      slug: 's3',
      meta: { title: 'AWS S3', dashboardIntegrationPath: 's3_wrapper' },
      remoteFile: 's3.md',
    },
    {
      slug: 's3_vectors',
      meta: { title: 'AWS S3 Vectors', dashboardIntegrationPath: 's3_vectors_wrapper' },
      remoteFile: 's3vectors.md',
    },
    {
      slug: 'shopify',
      meta: { title: 'Shopify' },
      remoteFile: 'shopify.md',
    },
    {
      slug: 'slack',
      meta: { title: 'Slack' },
      remoteFile: 'slack.md',
    },
    {
      slug: 'snowflake',
      meta: { title: 'Snowflake', dashboardIntegrationPath: 'snowflake_wrapper' },
      remoteFile: 'snowflake.md',
    },
    {
      slug: 'stripe',
      meta: { title: 'Stripe', dashboardIntegrationPath: 'stripe_wrapper' },
      remoteFile: 'stripe.md',
    },
  ],
}

export default wrappers
