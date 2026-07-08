/**
 * Registry of integration overview markdown, keyed by integration id
 * (= directory name under `static-data/integrations/`).
 *
 * The import specifiers must stay as string literals: both bundlers can only
 * code-split and apply their md-as-string loaders (raw-loader rule in
 * next.config.ts, `mdRawLoader` plugin in vite.config.ts) to imports they can
 * statically analyze. A template-literal specifier like
 * ``import(`@/static-data/integrations/${id}/overview.md`)`` happens to work
 * under webpack/turbopack (context modules) but is left untouched by
 * Vite/Rolldown and throws `TypeError: Failed to resolve module specifier`
 * at runtime in the TanStack build.
 *
 * `overviews.test.ts` asserts this map stays in sync with the files on disk —
 * when adding a new `overview.md`, add its entry here.
 */
const INTEGRATION_OVERVIEWS = {
  airtable_wrapper: () => import('@/static-data/integrations/airtable_wrapper/overview.md'),
  auth0_wrapper: () => import('@/static-data/integrations/auth0_wrapper/overview.md'),
  bigquery_wrapper: () => import('@/static-data/integrations/bigquery_wrapper/overview.md'),
  cal_wrapper: () => import('@/static-data/integrations/cal_wrapper/overview.md'),
  calendly_wrapper: () => import('@/static-data/integrations/calendly_wrapper/overview.md'),
  cfd1_wrapper: () => import('@/static-data/integrations/cfd1_wrapper/overview.md'),
  clerk_wrapper: () => import('@/static-data/integrations/clerk_wrapper/overview.md'),
  clickhouse_wrapper: () => import('@/static-data/integrations/clickhouse_wrapper/overview.md'),
  cognito_wrapper: () => import('@/static-data/integrations/cognito_wrapper/overview.md'),
  cron: () => import('@/static-data/integrations/cron/overview.md'),
  data_api: () => import('@/static-data/integrations/data_api/overview.md'),
  firebase_wrapper: () => import('@/static-data/integrations/firebase_wrapper/overview.md'),
  graphiql: () => import('@/static-data/integrations/graphiql/overview.md'),
  hubspot_wrapper: () => import('@/static-data/integrations/hubspot_wrapper/overview.md'),
  iceberg_wrapper: () => import('@/static-data/integrations/iceberg_wrapper/overview.md'),
  logflare_wrapper: () => import('@/static-data/integrations/logflare_wrapper/overview.md'),
  mssql_wrapper: () => import('@/static-data/integrations/mssql_wrapper/overview.md'),
  notion_wrapper: () => import('@/static-data/integrations/notion_wrapper/overview.md'),
  orb_wrapper: () => import('@/static-data/integrations/orb_wrapper/overview.md'),
  paddle_wrapper: () => import('@/static-data/integrations/paddle_wrapper/overview.md'),
  queues: () => import('@/static-data/integrations/queues/overview.md'),
  redis_wrapper: () => import('@/static-data/integrations/redis_wrapper/overview.md'),
  s3_vectors_wrapper: () => import('@/static-data/integrations/s3_vectors_wrapper/overview.md'),
  s3_wrapper: () => import('@/static-data/integrations/s3_wrapper/overview.md'),
  slack_wrapper: () => import('@/static-data/integrations/slack_wrapper/overview.md'),
  snowflake_wrapper: () => import('@/static-data/integrations/snowflake_wrapper/overview.md'),
  stripe_sync_engine: () => import('@/static-data/integrations/stripe_sync_engine/overview.md'),
  stripe_wrapper: () => import('@/static-data/integrations/stripe_wrapper/overview.md'),
  vault: () => import('@/static-data/integrations/vault/overview.md'),
  webhooks: () => import('@/static-data/integrations/webhooks/overview.md'),
} satisfies Record<string, () => Promise<{ default: string }>>

export const INTEGRATION_OVERVIEW_IDS = Object.keys(
  INTEGRATION_OVERVIEWS
) as (keyof typeof INTEGRATION_OVERVIEWS)[]

/**
 * Loads the overview markdown for an integration. Resolves to `null` when the
 * integration has no bundled overview (e.g. marketplace apps).
 */
export async function loadIntegrationOverview(integrationId: string): Promise<string | null> {
  const load = INTEGRATION_OVERVIEWS[integrationId as keyof typeof INTEGRATION_OVERVIEWS]
  if (!load) return null
  const mod = await load()
  return String(mod.default)
}
