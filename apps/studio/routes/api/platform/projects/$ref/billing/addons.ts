import { createFileRoute } from '@tanstack/react-router'
import { paths } from 'api-types'

import { createApiHandlers } from '@/lib/api/apiWrapper'

type ResponseData =
  paths['/platform/projects/{ref}/billing/addons']['get']['responses']['200']['content']['application/json']

export const Route = createFileRoute('/api/platform/projects/$ref/billing/addons')({
  server: {
    handlers: createApiHandlers({
      GET: () => {
        const response: ResponseData = {
          ref: '',
          selected_addons: [],
          available_addons: [],
        }

        return Response.json(response, { status: 200 })
      },
    }),
  },
})
