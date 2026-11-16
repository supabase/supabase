import assert from 'node:assert'
import { createFileRoute } from '@tanstack/react-router'
import { NextApiRequest, NextApiResponse } from 'next'
import z from 'zod/v4'

import { toWebHandler } from '@/compat/next/api'
import { apiWrapper } from '@/lib/api/apiWrapper'
import { markAlertIssuesRead } from '@/lib/api/self-hosted/alert-issues'

const bodySchema = z.object({
  alert_issue_ids: z.array(z.string()).min(1),
  read: z.boolean().default(true),
})

const nextHandler = (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res
      .status(405)
      .json({ data: null, error: { message: `Method ${req.method} Not Allowed` } })
  }

  const { ref } = req.query
  assert(typeof ref === 'string', 'Invalid or missing ref parameter')

  const body = bodySchema.safeParse(req.body)
  if (!body.success) return res.status(400).json({ error: { message: body.error.message } })

  const { data, error } = await markAlertIssuesRead({
    projectRef: ref,
    alertIssueIds: body.data.alert_issue_ids,
    read: body.data.read,
  })

  if (error) return res.status(500).json({ error: { message: error.message } })
  return res.status(200).json(data)
}

const webHandler = toWebHandler(nextHandler)

export const Route = createFileRoute('/api/platform/projects/$ref/alerts/issues/reads')({
  server: { handlers: { POST: webHandler } },
})
