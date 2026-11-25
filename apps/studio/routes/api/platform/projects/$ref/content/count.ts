import { createFileRoute } from '@tanstack/react-router'

import { createApiHandlers } from '@/lib/api/apiWrapper'
import { getSnippets } from '@/lib/api/snippets.utils'

export const Route = createFileRoute('/api/platform/projects/$ref/content/count')({
  server: {
    handlers: createApiHandlers({
      GET: async ({ request }) => {
        const name = new URL(request.url).searchParams.get('name') ?? undefined

        try {
          const { snippets } = await getSnippets({
            searchTerm: name,
            includeContent: false,
          })
          if (name) {
            return Response.json(
              {
                count: snippets.length,
              },
              { status: 200 }
            )
          }
          return Response.json(
            {
              shared: snippets.filter((s) => s.visibility === 'project').length,
              favorites: snippets.filter((s) => s.favorite).length,
              private: snippets.filter((s) => s.visibility === 'user').length,
            },
            { status: 200 }
          )
        } catch (error) {
          console.error('Error fetching snippets:', error)
          const message = error instanceof Error ? error.message : undefined
          return Response.json({ message: message ?? 'Failed to get count' }, { status: 500 })
        }
      },
    }),
  },
})
