import { type NextApiRequest, type NextApiResponse } from 'next'

import apiWrapper from '@/lib/api/apiWrapper'
import { getHostingAgentClient, getSitesStore } from '@/lib/api/self-hosted/hosting'

export default function handlerWithErrorCatching(req: NextApiRequest, res: NextApiResponse) {
  return apiWrapper(req, res, handler, { withAuth: true })
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGet(req, res)
    case 'PATCH':
      return handlePatch(req, res)
    case 'DELETE':
      return handleDelete(req, res)
    default:
      res.setHeader('Allow', ['GET', 'PATCH', 'DELETE'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

function getSlug(req: NextApiRequest): string | undefined {
  const slugParam = req.query.slug
  return Array.isArray(slugParam) ? slugParam[0] : slugParam
}

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const slug = getSlug(req)
  if (!slug) return res.status(404).json({ error: { message: `Missing 'slug' parameter` } })

  const site = await getSitesStore().getSite(slug)
  if (!site) return res.status(404).json({ error: { message: 'Site not found' } })

  return res.status(200).json(site)
}

const handlePatch = async (req: NextApiRequest, res: NextApiResponse) => {
  const slug = getSlug(req)
  if (!slug) return res.status(404).json({ error: { message: `Missing 'slug' parameter` } })

  const { domain, spaFallback, tls, apiProxy } = req.body ?? {}

  const store = getSitesStore()
  const site = await store.updateSite(slug, { domain, spaFallback, tls, apiProxy })

  let agentApplied = true
  let agentError: string | undefined
  try {
    await getHostingAgentClient().applySite(site)
  } catch (error) {
    agentApplied = false
    agentError = error instanceof Error ? error.message : 'Failed to apply nginx configuration'
  }

  return res.status(200).json({ ...site, agentApplied, agentError })
}

const handleDelete = async (req: NextApiRequest, res: NextApiResponse) => {
  const slug = getSlug(req)
  if (!slug) return res.status(404).json({ error: { message: `Missing 'slug' parameter` } })

  const store = getSitesStore()
  const site = await store.getSite(slug)
  if (!site) return res.status(404).json({ error: { message: 'Site not found' } })

  // Remove the nginx server block first (best-effort), then drop the files/registry.
  try {
    await getHostingAgentClient().removeSite(slug)
  } catch {
    // Proceed with local cleanup even if nginx couldn't be reloaded.
  }
  await store.deleteSite(slug)

  return res.status(200).json({})
}
