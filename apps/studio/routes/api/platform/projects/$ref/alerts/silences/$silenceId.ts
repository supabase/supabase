import assert from 'node:assert'
import { createFileRoute } from '@tanstack/react-router'
import { NextApiRequest, NextApiResponse } from 'next'

import { toWebHandler } from '@/compat/next/api'
import { apiWrapper } from '@/lib/api/apiWrapper'
import { deleteAlertSilence, getProxyErrorStatus } from '@/lib/api/self-hosted/alert-issues'

const nextHandler = (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE'])
    return res
      .status(405)
      .json({ data: null, error: { message: `Method ${req.method} Not Allowed` } })
  }

  const { silenceId } = req.query
  assert(typeof silenceId === 'string', 'Invalid or missing silenceId parameter')

  const { error } = await deleteAlertSilence({ silenceId })

  if (error)
    return res.status(getProxyErrorStatus(error)).json({ error: { message: error.message } })
  return res.status(200).json({ id: silenceId })
}

const webHandler = toWebHandler(nextHandler)

export const Route = createFileRoute('/api/platform/projects/$ref/alerts/silences/$silenceId')({
  server: { handlers: { DELETE: webHandler } },
})
