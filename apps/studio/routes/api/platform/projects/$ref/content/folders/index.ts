import { createFileRoute } from '@tanstack/react-router'
import { paths } from 'api-types'

import { getSearchParamsRecord, parseJsonBody } from '@/lib/api/apiHelpers'
import { createApiHandlers } from '@/lib/api/apiWrapper'
import { createFolder, deleteFolder, listFolderContents } from '@/lib/api/snippets.utils'

type PostRequestData =
  paths['/platform/projects/{ref}/content/folders']['post']['requestBody']['content']['application/json']

export const Route = createFileRoute('/api/platform/projects/$ref/content/folders/')({
  server: {
    handlers: createApiHandlers({
      GET: ({ request }) => listFolderContents(request),
      POST: async ({ request }) => {
        const { name } = await parseJsonBody<PostRequestData>(request)
        const folder = await createFolder(name)
        return Response.json(folder, { status: 201 })
      },
      DELETE: async ({ request }) => {
        const { ids } = getSearchParamsRecord(new URL(request.url).searchParams)
        if (!ids || typeof ids !== 'string') {
          return Response.json({ error: 'Folder IDs are required' }, { status: 400 })
        }

        const folderIds = ids.split(',').map((id) => id.trim())
        await Promise.all(folderIds.map((id) => deleteFolder(id)))

        return Response.json({})
      },
    }),
  },
})
