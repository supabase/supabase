import type { NavMenuConstant } from '@/components/Navigation/Navigation.types'

export const cronAndQueues: NavMenuConstant = {
  icon: 'cron',
  title: 'Cron and Queues',
  url: '/guides/cron',
  items: [
    {
      name: 'Cron',
      items: [
        {
          name: 'Getting Started',
          items: [
            { name: 'Install', url: '/guides/cron/install' },
            { name: 'Quickstart', url: '/guides/cron/quickstart' },
          ],
        },
        { name: 'Scheduling Edge Functions', url: '/guides/functions/schedule-functions' },
      ],
    },
    {
      name: 'Queues',
      items: [
        { name: 'Overview', url: '/guides/queues' },
        {
          name: 'Getting Started',
          items: [
            { name: 'Quickstart', url: '/guides/queues/quickstart' },
            {
              name: 'Consuming Messages with Edge Functions',
              url: '/guides/queues/consuming-messages-with-edge-functions',
            },
            {
              name: 'Expose Queues for local and self-hosted Supabase',
              url: '/guides/queues/expose-self-hosted-queues',
            },
          ],
        },
        {
          name: 'References',
          items: [
            { name: 'API', url: '/guides/queues/api' },
            { name: 'PGMQ Extension', url: '/guides/queues/pgmq' },
          ],
        },
      ],
    },
  ],
}
