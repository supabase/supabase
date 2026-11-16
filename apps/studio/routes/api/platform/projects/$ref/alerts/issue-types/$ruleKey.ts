import assert from 'node:assert'
import { createFileRoute } from '@tanstack/react-router'
import { NextApiRequest, NextApiResponse } from 'next'

import { toWebHandler } from '@/compat/next/api'
import { apiWrapper } from '@/lib/api/apiWrapper'
import { deleteAlertIssueType, getProxyErrorStatus } from '@/lib/api/self-hosted/alert-issues'

const nextHandler = (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE'])
    return res
      .status(405)
      .json({ data: null, error: { message: `Method ${req.method} Not Allowed` } })
  }

  const { ruleKey } = req.query
  assert(typeof ruleKey === 'string', 'Invalid or missing ruleKey parameter')

  const { error } = await deleteAlertIssueType({ ruleKey })

  if (error)
    return res.status(getProxyErrorStatus(error)).json({ error: { message: error.message } })
  return res.status(200).json({ rule_key: ruleKey })
}

const webHandler = toWebHandler(nextHandler)

export const Route = createFileRoute('/api/platform/projects/$ref/alerts/issue-types/$ruleKey')({
  server: { handlers: { DELETE: webHandler } },
})
