import { isFeatureEnabled } from 'common/enabled-features'

import type { NavMenuConstant } from '@/components/Navigation/Navigation.types'

const { integrationsPartners: integrationsEnabled } = isFeatureEnabled(['integrations:partners'])

export const integrations: NavMenuConstant = {
  title: 'Integrations',
  icon: 'integrations',
  url: '/guides/integrations',
  enabled: integrationsEnabled,
  items: [
    { name: 'Partner catalog', url: '/guides/integrations/partner-catalog' },
    { name: 'Vercel Marketplace', url: '/guides/integrations/vercel-marketplace' },
    { name: 'Vercel preview branches', url: '/guides/integrations/vercel-preview-branches' },
    { name: 'Stripe Projects', url: '/guides/integrations/stripe-projects' },
    {
      name: 'Build your own integration',
      items: [
        {
          name: 'Supabase OAuth integration',
          items: [
            { name: 'Overview', url: '/guides/integrations/build-a-supabase-oauth-integration' },
            {
              name: 'OAuth scopes',
              url: '/guides/integrations/build-a-supabase-oauth-integration/oauth-scopes',
            },
          ],
        },
        { name: 'Supabase for Platforms', url: '/guides/integrations/supabase-for-platforms' },
        {
          name: 'Build a partner integration',
          url: '/guides/integrations/partner-integration-guide',
        },
      ],
    },
    // NavigationMenuGuideList fills this with the federated partner integrations.
    { name: 'Integrations', items: [] },
  ],
}
