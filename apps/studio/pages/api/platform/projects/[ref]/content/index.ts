import { paths } from 'api-types'
import { NextApiRequest, NextApiResponse } from 'next'

import apiWrapper from 'lib/api/apiWrapper'
import {
  deleteSnippet,
  getSnippet,
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
    case 'POST':
      return handlePost(req, res)
    case 'DELETE':
      return handleDelete(req, res)
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'POST', 'DELETE'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

type GetRequestData = paths['/platform/projects/{ref}/content']['get']['parameters']['query']
type GetResponseData =
  paths['/platform/projects/{ref}/content']['get']['responses']['200']['content']['application/json']

const handleGetAll = async (req: NextApiRequest, res: NextApiResponse<GetResponseData>) => {
  const params = req.query as GetRequestData

  // Platform specific endpoint
  if (params?.visibility === 'project') {
    return res.status(200).json({ data: [] })
  }

  try {
    const { cursor, snippets } = await getSnippets({
      searchTerm: params?.name,
      limit: params?.limit ? Number(params.limit) : undefined,
      cursor: params?.cursor,
      sort: params?.sort_by,
      sortOrder: params?.sort_order,
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
    // try to get the snippet first, if the snippet doesn't exist, it will throw an error
    await getSnippet(updates.id)
    const updatedSnippet = await updateSnippet(updates.id, updates)
    return res.status(200).json(updatedSnippet)
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('not found')) {
      const body = req.body
      const { data, error } = SnippetSchema.safeParse(body)

      if (error) {
        console.error('Validation error:', error)
        return res.status(400).json({ error: error.message })
      }

      try {
        const savedSnippet = await saveSnippet(data)
        return res.status(200).json(savedSnippet)
      } catch (error) {
        console.error('Error creating snippet:', error)
        return res.status(500).json({ error: 'Failed to create snippet' })
      }
    }
    return res.status(500).json({ message: error?.message ?? 'Failed to update snippet' })
  }
}

type PostRequestData =
  paths['/platform/projects/{ref}/content']['post']['requestBody']['content']['application/json']

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const body = req.body as PostRequestData

  const { data, error } = SnippetSchema.safeParse(body)

  if (error) {
    console.error('Validation error:', error)
    return res.status(400).json({ error: error.message })
  }

  try {
    const savedSnippet = await saveSnippet(data)
    return res.status(200).json(savedSnippet)
  } catch (error) {
    console.error('Error creating snippet:', error)
    return res.status(500).json({ error: 'Failed to create snippet' })
  }
}

const handleDelete = async (req: NextApiRequest, res: NextApiResponse) => {
  const { ids } = req.query

  if (!ids || typeof ids !== 'string') {
    return res.status(400).json({ error: 'Snippet IDs are required' })
  }
  const snippetIds = ids.split(',').map((id) => id.trim())
  if (snippetIds.length === 0) {
    return res.status(400).json({ error: 'No snippet IDs provided' })
  }

  try {
    for (const id of snippetIds) {
      await deleteSnippet(id)
    }
    return res.status(200).send(snippetIds.map((id) => ({ id })))
  } catch (error) {
    console.error('Error deleting snippets:', error)
    return res.status(500).json({ error: 'Failed to delete snippets' })
  }
}

export default wrappedHandler
