import { createFileRoute } from '@tanstack/react-router'

import { createApiHandlers } from '@/lib/api/apiWrapper'

export const Route = createFileRoute('/api/platform/organizations/')({
  server: {
    handlers: createApiHandlers({
      GET: () => {
        // Platform specific endpoint
        const response = [
          {
            id: 1,
            name: process.env.DEFAULT_ORGANIZATION_NAME || 'Default Organization',
            slug: 'default-org-slug',
            billing_email: 'billing@supabase.co',
            plan: {
              id: 'enterprise',
              name: 'Enterprise',
            },
          },
        ]
        return Response.json(response, { status: 200 })
      },
    }),
  },
})
