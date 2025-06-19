import { paths } from 'api-types'
import apiWrapper from 'lib/api/apiWrapper'
import { NextApiRequest, NextApiResponse } from 'next'
import {
  deleteSnippet,
  filterSnippetsByFavorite,
  readAllSnippets,
  saveSnippet,
  SnippetSchema,
  updateSnippet,
} from './_helpers'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGetAll(req, res)
    case 'PUT':
      return handlePost(req, res)
    case 'POST':
      return handlePost(req, res)
    case 'DELETE':
      return handleDelete(req, res)
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

type GetRequestData = paths['/platform/projects/{ref}/content']['get']['parameters']['query']
type GetResponseData =
  paths['/platform/projects/{ref}/content']['get']['responses']['200']['content']['application/json']

const handleGetAll = async (req: NextApiRequest, res: NextApiResponse<GetResponseData>) => {
  const params = req.query as GetRequestData
  const { ref: projectRef } = req.query

  // Platform specific endpoint
  if (params?.visibility === 'project') {
    return res.status(200).json({ data: [] })
  }

  try {
    const snippets = await readAllSnippets()
    const filteredSnippets = filterSnippetsByFavorite(snippets, params?.favorite)
    return res.status(200).json({ data: filteredSnippets })
  } catch (error) {
    console.error('Error fetching snippets:', error)
    return res.status(500).json({ data: [] })
  }
}

type PutRequestData =
  paths['/platform/projects/{ref}/content']['put']['requestBody']['content']['application/json']
type PutResponseData = any

const handlePost = async (req: NextApiRequest, res: NextApiResponse<PutResponseData>) => {
  const body = req.body as PutRequestData
  const { ref: projectRef } = req.query

  const { data, error } = SnippetSchema.safeParse(body)

  if (error) {
    console.error('Validation error:', error)
    return res.status(400).json({ error: error.message })
  }

  try {
    const savedSnippet = await saveSnippet(data, projectRef as string)
    return res.status(200).json(savedSnippet)
  } catch (error) {
    console.error('Error creating snippet:', error)
    return res.status(500).json({ error: 'Failed to create snippet' })
  }
}

const handlePut = async (req: NextApiRequest, res: NextApiResponse) => {
  const { ref: projectRef } = req.query
  const updates = req.body

  try {
    const updatedSnippet = await updateSnippet(updates.id, updates, projectRef as string)
    return res.status(200).json(updatedSnippet)
  } catch (error) {
    console.error('Error updating snippet:', error)
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ error: error.message })
    }
    return res.status(500).json({ error: 'Failed to update snippet' })
  }
}

const handleDelete = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Snippet ID is required' })
  }

  try {
    await deleteSnippet(id)
    return res.status(204).send(null)
  } catch (error) {
    console.error('Error deleting snippet:', error)
    return res.status(500).json({ error: 'Failed to delete snippet' })
  }
}
