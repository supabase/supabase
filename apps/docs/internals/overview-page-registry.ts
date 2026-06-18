/**
 * Canonical list of docs overview/index MDX paths (relative to content/guides/).
 * Used by lint-content-listings.ts for coverage tracking.
 */
export const OVERVIEW_PAGE_REGISTRY = [
  // Section roots
  'getting-started.mdx',
  'ai-tools.mdx',
  'ai.mdx',
  'auth.mdx',
  'api.mdx',
  'cli.mdx',
  'cron.mdx',
  'database/overview.mdx',
  'deployment.mdx',
  'functions.mdx',
  'integrations.mdx',
  'local-development.mdx',
  'platform.mdx',
  'queues.mdx',
  'realtime.mdx',
  'resources.mdx',
  'security.mdx',
  'self-hosting.mdx',
  'storage.mdx',
  'telemetry.mdx',
  // Subsection overviews
  'auth/server-side.mdx',
  'auth/social-login.mdx',
  'auth/enterprise-sso.mdx',
  'auth/auth-mfa.mdx',
  'auth/oauth-server.mdx',
  'auth/third-party/overview.mdx',
  'auth/auth-hooks.mdx',
  'auth/jwts.mdx',
  'database/orioledb.mdx',
  'database/replication.mdx',
  'database/extensions.mdx',
  'database/extensions/wrappers/overview.mdx',
  'ai/vector-indexes.mdx',
  'deployment/branching.mdx',
  'integrations/build-a-supabase-oauth-integration.mdx',
  'platform/read-replicas.mdx',
  'platform/migrating-within-supabase.mdx',
  'platform/migrating-to-supabase.mdx',
  'platform/multi-factor-authentication.mdx',
  'platform/sso.mdx',
  'platform/manage-your-usage.mdx',
  'platform/aws-marketplace.mdx',
  'telemetry/metrics.mdx',
  // Subsection indexes
  'local-development/overview.mdx',
  'local-development/testing/overview.mdx',
  'realtime/getting_started.mdx',
  'storage/analytics/introduction.mdx',
  'storage/vector/introduction.mdx',
] as const

export type OverviewPagePath = (typeof OVERVIEW_PAGE_REGISTRY)[number]

/** Phase 1 pilots — lint errors when these pages lack valid contentListings front matter. */
export const OVERVIEW_PAGE_PILOTS: readonly OverviewPagePath[] = [
  'database/overview.mdx',
  'auth.mdx',
  'storage.mdx',
  'getting-started.mdx',
  'functions.mdx',
]

export const BANNED_ORIENTATION_HEADINGS = [
  '## Get started',
  '## Going further',
  '### Get started',
  '### Going further',
  '## Next steps',
  '### Next steps',
] as const
