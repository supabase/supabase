import { createFileRoute } from '@tanstack/react-router'
import { paths } from 'api-types'
import { compact } from 'lodash'
import { z } from 'zod'

import { parseJsonBody } from '@/lib/api/apiHelpers'
import { createApiHandlers } from '@/lib/api/apiWrapper'
import {
  deleteSnippet,
  getSnippets,
  saveSnippet,
  SnippetSchema,
  updateSnippet,
} from '@/lib/api/snippets.utils'

type GetResponseData =
  paths['/platform/projects/{ref}/content']['get']['responses']['200']['content']['application/json']

const getRequestParamsSchema = z.object({
  visibility: z.enum(['project', 'user']).optional(),
  name: z.string().optional(),
  limit: z
    .string()
    .transform((val) => Number(val))
    .pipe(z.number().int().positive())
    .optional(),
  cursor: z.string().optional(),
  sort_by: z.enum(['name', 'inserted_at']).optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
})

const snippetIdsSchema = z
  .string()
  .transform((val) => compact(val.split(',').map((id) => id.trim())))
  .pipe(z.array(z.string().uuid()).nonempty())

export const Route = createFileRoute('/api/platform/projects/$ref/content/')({
  server: {
    handlers: createApiHandlers({
      GET: async ({ request }) => {
        const query = Object.fromEntries(new URL(request.url).searchParams.entries())
        const result = getRequestParamsSchema.safeParse(query)

        if (!result.success) {
          return Response.json({ data: [] } satisfies GetResponseData, { status: 400 })
        }

        const params = result.data

        // Platform specific endpoint
        if (params.visibility === 'project') {
          return Response.json({ data: [] } satisfies GetResponseData, { status: 200 })
        }

        try {
          const { cursor, snippets } = await getSnippets({
            searchTerm: params.name,
            limit: params.limit,
            cursor: params.cursor,
            sort: params.sort_by,
            sortOrder: params.sort_order,
          })

          return Response.json({ data: snippets, cursor } satisfies GetResponseData, {
            status: 200,
          })
        } catch (error) {
          console.error('Error fetching snippets:', error)
          return Response.json({ data: [] } satisfies GetResponseData, { status: 500 })
        }
      },
      PUT: async ({ request }) => {
        const body = await parseJsonBody<Record<string, unknown> & { id: string }>(request)
        try {
          const updatedSnippet = await updateSnippet(body.id, body)
          return Response.json(updatedSnippet, { status: 200 })
        } catch (error) {
          if (error instanceof Error && error.message.includes('not found')) {
            const { data, error: parseError } = SnippetSchema.safeParse(body)

            if (parseError) {
              console.error('Validation error:', parseError)
              return Response.json({ error: parseError.message }, { status: 400 })
            }

            try {
              const savedSnippet = await saveSnippet(data)
              return Response.json(savedSnippet, { status: 200 })
            } catch (createError) {
              console.error('Error creating snippet:', createError)
              return Response.json({ error: 'Failed to create snippet' }, { status: 500 })
            }
          }
          const message = error instanceof Error ? error.message : undefined
          return Response.json({ error: message ?? 'Failed to update snippet' }, { status: 500 })
        }
      },
      DELETE: async ({ request }) => {
        const ids = new URL(request.url).searchParams.get('ids') ?? undefined

        const result = snippetIdsSchema.safeParse(ids)
        if (!result.success) {
          return Response.json({ error: 'Snippet IDs are required' }, { status: 400 })
        }

        const snippetIds = result.data

        try {
          for (const id of snippetIds) {
            await deleteSnippet(id)
          }
          return Response.json(
            snippetIds.map((id) => ({ id })),
            { status: 200 }
          )
        } catch (error) {
          console.error('Error deleting snippets:', error)
          return Response.json({ error: 'Failed to delete snippets' }, { status: 500 })
        }
      },
    }),
  },
})
