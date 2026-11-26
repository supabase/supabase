import { createFileRoute } from '@tanstack/react-router'

import { createApiHandlers } from '@/lib/api/apiWrapper'
import { getSnippet } from '@/lib/api/snippets.utils'

export const Route = createFileRoute('/api/platform/projects/$ref/content/item/$id')({
  server: {
    handlers: createApiHandlers({
      GET: async ({ params }) => {
        try {
          const snippet = await getSnippet(params.id)

          return Response.json(snippet)
        } catch (error) {
          if (error instanceof Error && error.message.includes('not found')) {
            return Response.json({ message: 'Content not found.' }, { status: 404 })
          }
          return Response.json(
            { data: null, error: { message: 'Internal Server Error' } },
            { status: 500 }
          )
        }
      },
    }),
  },
})
