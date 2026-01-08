import { paths } from 'api-types'
import { compact } from 'lodash'
import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'

import apiWrapper from 'lib/api/apiWrapper'
import {
  deleteSnippet,
  getSnippets,
  saveSnippet,
  SnippetSchema,
  updateSnippet,
} from 'lib/api/snippets.utils'

const wrappedHandler = (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGetAll(req, res)
    case 'PUT':
      return handlePut(req, res)

    case 'DELETE':
      return handleDelete(req, res)
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

type GetRequestData = paths['/platform/projects/{ref}/content']['get']['parameters']['query']
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

const handleGetAll = async (req: NextApiRequest, res: NextApiResponse<GetResponseData>) => {
  const result = getRequestParamsSchema.safeParse(req.query)

  if (!result.success) {
    return res.status(400).json({ data: [] })
  }

  const params = result.data

  // Platform specific endpoint
  if (params.visibility === 'project') {
    return res.status(200).json({ data: [] })
  }

  try {
    const { cursor, snippets } = await getSnippets({
      searchTerm: params.name,
      limit: params.limit,
      cursor: params.cursor,
      sort: params.sort_by,
      sortOrder: params.sort_order,
    })

    return res.status(200).json({ data: snippets, cursor })
  } catch (error) {
    console.error('Error fetching snippets:', error)
    return res.status(500).json({ data: [] })
  }
}

const handlePut = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const updates = req.body
    const updatedSnippet = await updateSnippet(updates.id, updates)
    return res.status(200).json(updatedSnippet)
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('not found')) {
      const body = req.body
      const { data, error: parseError } = SnippetSchema.safeParse(body)

      if (parseError) {
        console.error('Validation error:', parseError)
        return res.status(400).json({ error: parseError.message })
      }

      try {
        const savedSnippet = await saveSnippet(data)
        return res.status(200).json(savedSnippet)
      } catch (error) {
        console.error('Error creating snippet:', error)
        return res.status(500).json({ error: 'Failed to create snippet' })
      }
    }
    return res.status(500).json({ error: error?.message ?? 'Failed to update snippet' })
  }
}

const snippetIdsSchema = z
  .string()
  .transform((val) => compact(val.split(',').map((id) => id.trim())))
  .pipe(z.array(z.string().uuid()).nonempty())

const handleDelete = async (req: NextApiRequest, res: NextApiResponse) => {
  const { ids } = req.query

  const result = snippetIdsSchema.safeParse(ids)
  if (!result.success) {
    return res.status(400).json({ error: 'Snippet IDs are required' })
  }

  const snippetIds = result.data

  try {
    for (const id of snippetIds) {
      await deleteSnippet(id)
    }
    res.setHeader('Content-Type', 'application/json')
    return res.status(200).send(snippetIds.map((id) => ({ id })))
  } catch (error) {
    console.error('Error deleting snippets:', error)
    return res.status(500).json({ error: 'Failed to delete snippets' })
  }
}

export default wrappedHandler
