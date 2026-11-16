import assert from 'node:assert'
import { createFileRoute } from '@tanstack/react-router'
import { NextApiRequest, NextApiResponse } from 'next'

import { toWebHandler } from '@/compat/next/api'
import { apiWrapper } from '@/lib/api/apiWrapper'
import { getAlertIssueEvents, getProxyErrorStatus } from '@/lib/api/self-hosted/alert-issues'

const nextHandler = (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res
      .status(405)
      .json({ data: null, error: { message: `Method ${req.method} Not Allowed` } })
  }

  const { ref, alertIssueId, from, to } = req.query
  assert(typeof ref === 'string', 'Invalid or missing ref parameter')
  assert(typeof alertIssueId === 'string', 'Invalid or missing alertIssueId parameter')

  const { data, error } = await getAlertIssueEvents({
    projectRef: ref,
    alertIssueId,
    from: typeof from === 'string' ? from : undefined,
    to: typeof to === 'string' ? to : undefined,
  })

  if (error)
    return res.status(getProxyErrorStatus(error)).json({ error: { message: error.message } })
  return res.status(200).json(data)
}

const webHandler = toWebHandler(nextHandler)

export const Route = createFileRoute(
  '/api/platform/projects/$ref/alerts/issues/$alertIssueId/events'
)({
  server: { handlers: { GET: webHandler } },
})
