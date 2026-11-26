import { createFileRoute } from '@tanstack/react-router'

import { createApiHandlers } from '@/lib/api/apiWrapper'
import { listFolderContents } from '@/lib/api/snippets.utils'

export const Route = createFileRoute('/api/platform/projects/$ref/content/folders/$id')({
  server: {
    handlers: createApiHandlers({
      GET: ({ request, params }) => listFolderContents(request, params.id),
      // Platform specific endpoint
      PATCH: () => Response.json({}),
    }),
  },
})
