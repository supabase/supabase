import { createFileRoute } from '@tanstack/react-router'
import { paths } from 'api-types'

import { createApiHandlers } from '@/lib/api/apiWrapper'
import { folderQueryParamsSchema, getFolders, getSnippets } from '@/lib/api/snippets.utils'

type GetResponseData =
  paths['/platform/projects/{ref}/content/folders/{id}']['get']['responses']['200']['content']['application/json']

export const Route = createFileRoute('/api/platform/projects/$ref/content/folders/$id')({
  server: {
    handlers: createApiHandlers({
      GET: async ({ request, params: routeParams }) => {
        const query = Object.fromEntries(new URL(request.url).searchParams.entries())
        const result = folderQueryParamsSchema.safeParse(query)

        if (!result.success) {
          return Response.json({ data: { folders: [], contents: [] } } satisfies GetResponseData, {
            status: 400,
          })
        }

        const queryParams = result.data
        const folderId = routeParams.id ?? null

        const folders = await getFolders(folderId)
        // Folder listings return metadata only (no SQL body) to match the Management API contract; the
        // editor loads each snippet's content on demand via the item endpoint.
        const { cursor, snippets } = await getSnippets({
          searchTerm: queryParams.name,
          cursor: queryParams.cursor,
          folderId: folderId,
          limit: queryParams.limit,
          sort: queryParams.sort_by,
          sortOrder: queryParams.sort_order,
          includeContent: false,
        })

        return Response.json(
          { data: { folders, contents: snippets }, cursor } satisfies GetResponseData,
          { status: 200 }
        )
      },
      // Platform specific endpoint
      PATCH: () => Response.json({}, { status: 200 }),
    }),
  },
})
