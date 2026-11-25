import { createFileRoute } from '@tanstack/react-router'
import { paths } from 'api-types'

import { createApiHandlers } from '@/lib/api/apiWrapper'

type ResponseData =
  paths['/platform/organizations/{slug}/billing/subscription']['get']['responses']['200']['content']['application/json']

export const Route = createFileRoute('/api/platform/organizations/$slug/billing/subscription')({
  server: {
    handlers: createApiHandlers({
      GET: () => {
        const response: ResponseData = {
          current_period_end: 0,
          current_period_start: 0,
          next_invoice_at: 0,
          usage_billing_enabled: false,
          plan: {
            id: 'enterprise',
            name: 'Enterprise',
          },
          addons: [],
          project_addons: [],
          payment_method_type: '',
          billing_via_partner: false,
          billing_partner: 'aws_marketplace',
          customer_balance: 0,
        }

        return Response.json(response, { status: 200 })
      },
    }),
  },
})
