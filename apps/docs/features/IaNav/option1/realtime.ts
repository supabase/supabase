import { isFeatureEnabled } from 'common/enabled-features'

import type { NavMenuConstant } from '@/components/Navigation/Navigation.types'

const { billingAll: billingEnabled } = isFeatureEnabled(['billing:all'])

export const realtime: NavMenuConstant = {
  icon: 'realtime',
  title: 'Realtime',
  url: '/guides/realtime',
  items: [
    { name: 'Getting started', url: '/guides/realtime/getting_started' },
    {
      name: 'Usage',
      items: [
        { name: 'Broadcast', url: '/guides/realtime/broadcast' },
        { name: 'Presence', url: '/guides/realtime/presence' },
        { name: 'Postgres Changes', url: '/guides/realtime/postgres-changes' },
        { name: 'Settings', url: '/guides/realtime/settings' },
      ],
    },
    { name: 'Authorization', url: '/guides/realtime/authorization' },
    {
      name: 'Tutorials',
      items: [
        {
          name: 'Listen to database changes',
          url: '/guides/realtime/subscribing-to-database-changes',
        },
        { name: 'Using Realtime with Next.js', url: '/guides/realtime/realtime-with-nextjs' },
        {
          name: 'Presence with Flutter',
          url: '/guides/realtime/realtime-user-presence',
        },
        {
          name: 'Flutter Postgres Changes',
          url: '/guides/realtime/realtime-listening-flutter',
        },
      ],
    },
    {
      name: 'Architecture and limits',
      items: [
        { name: 'Architecture', url: '/guides/realtime/architecture' },
        { name: 'Concepts', url: '/guides/realtime/concepts' },
        { name: 'Protocol', url: '/guides/realtime/protocol' },
        { name: 'Benchmarks', url: '/guides/realtime/benchmarks' },
        { name: 'Limits', url: '/guides/realtime/limits', enabled: billingEnabled },
        { name: 'Pricing', url: '/guides/realtime/pricing', enabled: billingEnabled },
      ],
    },
    {
      name: 'Debugging and reports',
      items: [
        { name: 'Operational error codes', url: '/guides/realtime/error_codes' },
        { name: 'Realtime reports', url: '/guides/realtime/reports' },
      ],
    },
  ],
}
