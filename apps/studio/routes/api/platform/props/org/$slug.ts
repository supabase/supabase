import { createFileRoute } from '@tanstack/react-router'

import { createApiHandlers } from '@/lib/api/apiWrapper'

export const Route = createFileRoute('/api/platform/props/org/$slug')({
  server: {
    handlers: createApiHandlers({
      GET: () => {
        // Platform specific endpoint
        const response = {
          members: [],
          products: [],
          customer: {
            customer: {},
            subscriptions: {},
            total_paid_projects: 0,
            total_free_projects: 0,
            total_pro_projects: 0,
            total_team_projects: 0,
            total_payg_projects: 0,
          },
        }

        return Response.json(response, { status: 200 })
      },
    }),
  },
})
