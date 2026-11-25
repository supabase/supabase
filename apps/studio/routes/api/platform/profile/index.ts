import { createFileRoute } from '@tanstack/react-router'

import { createApiHandlers } from '@/lib/api/apiWrapper'
import { DEFAULT_PROJECT } from '@/lib/constants/api'

export const Route = createFileRoute('/api/platform/profile/')({
  server: {
    handlers: createApiHandlers({
      GET: () => {
        // Platform specific endpoint
        const response = {
          id: 1,
          primary_email: 'johndoe@supabase.io',
          username: 'johndoe',
          first_name: 'John',
          last_name: 'Doe',
          organizations: [
            {
              id: 1,
              name: process.env.DEFAULT_ORGANIZATION_NAME || 'Default Organization',
              slug: 'default-org-slug',
              billing_email: 'billing@supabase.co',
              projects: [{ ...DEFAULT_PROJECT, connectionString: '' }],
            },
          ],
        }
        return Response.json(response, { status: 200 })
      },
    }),
  },
})
