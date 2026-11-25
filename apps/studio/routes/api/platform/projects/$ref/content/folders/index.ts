import { createFileRoute } from '@tanstack/react-router'
import { paths } from 'api-types'

import { parseJsonBody } from '@/lib/api/apiHelpers'
import { createApiHandlers } from '@/lib/api/apiWrapper'
import { createFolder, deleteFolder, getFolders, getSnippets } from '@/lib/api/snippets.utils'

type GetRequestData =
  paths['/platform/projects/{ref}/content/folders']['get']['parameters']['query']
type GetResponseData =
  paths['/platform/projects/{ref}/content/folders']['get']['responses']['200']['content']['application/json']
type PostRequestData =
  paths['/platform/projects/{ref}/content/folders']['post']['requestBody']['content']['application/json']

export const Route = createFileRoute('/api/platform/projects/$ref/content/folders/')({
  server: {
    handlers: createApiHandlers({
      GET: async ({ request }) => {
        const params = Object.fromEntries(
          new URL(request.url).searchParams.entries()
        ) as GetRequestData

        const folders = await getFolders()
        // Folder listings return metadata only (no SQL body) to match the Management API contract; the
        // editor loads each snippet's content on demand via the item endpoint.
        const { cursor, snippets } = await getSnippets({
          searchTerm: params?.name,
          limit: params?.limit ? Number(params.limit) : undefined,
          cursor: params?.cursor,
          sort: params?.sort_by,
          sortOrder: params?.sort_order,
          includeContent: false,
        })

        return Response.json(
          { data: { folders, contents: snippets }, cursor } satisfies GetResponseData,
          { status: 200 }
        )
      },
      POST: async ({ request }) => {
        const { name } = await parseJsonBody<PostRequestData>(request)

        const folder = await createFolder(name)

        return Response.json(folder, { status: 201 })
      },
      DELETE: async ({ request }) => {
        const ids = new URL(request.url).searchParams.get('ids')

        if (!ids) {
          return Response.json({ error: 'Folder IDs are required' }, { status: 400 })
        }
        const folderIds = ids.split(',').map((id) => id.trim())

        await Promise.all(folderIds.map((id) => deleteFolder(id)))

        return Response.json({}, { status: 200 })
      },
    }),
  },
})
