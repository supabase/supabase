import { type NextApiRequest, type NextApiResponse } from 'next'

import apiWrapper from '@/lib/api/apiWrapper'
import { getSitesStore } from '@/lib/api/self-hosted/hosting'

export default function handlerWithErrorCatching(req: NextApiRequest, res: NextApiResponse) {
  return apiWrapper(req, res, handler, { withAuth: true })
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGet(req, res)
    case 'POST':
      return handlePost(req, res)
    case 'DELETE':
      return handleDelete(req, res)
    default:
      res.setHeader('Allow', ['GET', 'POST', 'DELETE'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

function getSlug(req: NextApiRequest): string | undefined {
  const slugParam = req.query.slug
  return Array.isArray(slugParam) ? slugParam[0] : slugParam
}

function getPath(req: NextApiRequest): string | undefined {
  const pathParam = req.query.path
  return Array.isArray(pathParam) ? pathParam[0] : pathParam
}

async function resolveDocroot(req: NextApiRequest, res: NextApiResponse) {
  const slug = getSlug(req)
  if (!slug) {
    res.status(404).json({ error: { message: `Missing 'slug' parameter` } })
    return undefined
  }
  const store = getSitesStore()
  const site = await store.getSite(slug)
  if (!site) {
    res.status(404).json({ error: { message: 'Site not found' } })
    return undefined
  }
  return { store, site }
}

// GET ?path=<file> → file contents; otherwise → list of files in the docroot.
const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const resolved = await resolveDocroot(req, res)
  if (!resolved) return
  const { store, site } = resolved

  const filePath = getPath(req)
  if (filePath) {
    const content = await store.readFile(site.docroot, filePath)
    return res.status(200).json({ path: filePath, content })
  }

  const files = await store.listFiles(site.docroot)
  return res.status(200).json(files)
}

// POST { path, content } → write/replace a single text file (used by the editor).
const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const resolved = await resolveDocroot(req, res)
  if (!resolved) return
  const { store, site } = resolved

  const { path: filePath, content } = req.body ?? {}
  if (typeof filePath !== 'string' || typeof content !== 'string') {
    return res.status(400).json({ error: { message: 'path and content are required' } })
  }

  await store.writeFiles(site.docroot, [{ name: filePath, content }], { replace: false })
  return res.status(200).json({ path: filePath })
}

// DELETE ?path=<file> → remove a single file.
const handleDelete = async (req: NextApiRequest, res: NextApiResponse) => {
  const resolved = await resolveDocroot(req, res)
  if (!resolved) return
  const { store, site } = resolved

  const filePath = getPath(req)
  if (!filePath) return res.status(400).json({ error: { message: `Missing 'path' parameter` } })

  await store.deleteFile(site.docroot, filePath)
  return res.status(200).json({})
}
