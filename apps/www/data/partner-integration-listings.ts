import type { IntegrationListing } from '~/types/partners'

type StudioIntegrationEntry = Omit<
  IntegrationListing,
  'content' | 'images' | 'youtubeId' | 'installUrl' | 'isMarketplace'
> & {
  type: 'wrapper' | 'template'
  dashboardUrl: string
}

/**
 * Additional Studio-managed integration surfaces for catalog partners.
 * Keyed by the partner's catalog slug.
 *
 * The "guide" listing is always derived from the Partner DB record itself.
 * These entries appear as extra tabs when a partner has more than one integration surface.
 *
 * Adding a partner here is appropriate when:
 *   - The catalog entry is a general integration guide (e.g. an auth guide), AND
 *   - There is also a separate Studio wrapper/template that lets users query that partner's data
 *     via SQL or install a dashboard integration — a genuinely different surface.
 *
 * Do NOT add a partner here when the catalog content IS already the wrapper guide
 * (single listing is correct in that case — the extra tab would just duplicate content).
 *
 * Pending content audit before adding: airtable, clickhouse, snowflake, paddle,
 * notion, slack, hubspot, calendly, cal-com, orb, cloudflare-workers (D1 wrapper).
 */
export const PARTNER_INTEGRATION_OVERRIDES: Record<string, StudioIntegrationEntry[]> = {
  // ── Stripe ──────────────────────────────────────────────────────────────────
  // Catalog: general payments integration guide
  // + FDW: query Stripe objects via SQL
  // + Template: full bidirectional sync engine
  stripe: [
    {
      slug: 'stripe-wrapper',
      name: 'Foreign Data Wrapper',
      type: 'wrapper',
      description:
        'Query your Stripe data directly via SQL using the Stripe Foreign Data Wrapper. Read accounts, customers, subscriptions, invoices, and more as Postgres tables.',
      docsUrl: 'https://supabase.com/docs/guides/database/extensions/wrappers/stripe',
      dashboardUrl: '/dashboard/project/_/integrations/stripe_wrapper/wrappers',
    },
    {
      slug: 'stripe-sync-engine',
      name: 'Stripe Sync Engine',
      type: 'template',
      description:
        'Continuously sync your Stripe payments, customers, and subscription data into your Postgres database using Supabase Queues and Edge Functions.',
      docsUrl: 'https://github.com/stripe-experiments/sync-engine/',
      dashboardUrl: '/dashboard/project/_/integrations/stripe_sync_engine',
    },
  ],

  // ── Auth0 ────────────────────────────────────────────────────────────────────
  // Catalog: auth integration guide (JWT / user migration)
  // + FDW: query Auth0 users directly from Postgres
  auth0: [
    {
      slug: 'auth0-wrapper',
      name: 'Foreign Data Wrapper',
      type: 'wrapper',
      description:
        'Query your Auth0 users and management data directly from Postgres using the Auth0 Foreign Data Wrapper.',
      docsUrl: 'https://supabase.com/docs/guides/database/extensions/wrappers/auth0',
      dashboardUrl: '/dashboard/project/_/integrations/auth0_wrapper/wrappers',
    },
  ],

  // ── Clerk ────────────────────────────────────────────────────────────────────
  // Catalog: auth integration guide (JWT / session integration)
  // + FDW: query Clerk users, organizations, and more from Postgres
  clerk: [
    {
      slug: 'clerk-wrapper',
      name: 'Foreign Data Wrapper',
      type: 'wrapper',
      description:
        'Query your Clerk users, organizations, memberships, and more directly from Postgres using the Clerk Foreign Data Wrapper.',
      docsUrl: 'https://supabase.com/docs/guides/database/extensions/wrappers/clerk',
      dashboardUrl: '/dashboard/project/_/integrations/clerk_wrapper/wrappers',
    },
  ],
}
