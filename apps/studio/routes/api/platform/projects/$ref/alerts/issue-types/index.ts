import assert from 'node:assert'
import { createFileRoute } from '@tanstack/react-router'
import { NextApiRequest, NextApiResponse } from 'next'
import z from 'zod/v4'

import { toWebHandler } from '@/compat/next/api'
import { apiWrapper } from '@/lib/api/apiWrapper'
import {
  createAlertIssueType,
  getProxyErrorStatus,
  listAlertIssueTypes,
} from '@/lib/api/self-hosted/alert-issues'

const bodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  lql: z.string().trim().min(1),
  severity: z.enum(['critical', 'major', 'warning', 'info']),
  category: z.enum(['security', 'performance', 'health']),
  description: z.string().optional(),
  group_by: z.array(z.string().trim().min(1)).optional(),
})

const nextHandler = (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { ref } = req.query
  assert(typeof ref === 'string', 'Invalid or missing ref parameter')

  if (req.method === 'GET') {
    const { data, error } = await listAlertIssueTypes({ projectRef: ref })
    if (error)
      return res.status(getProxyErrorStatus(error)).json({ error: { message: error.message } })
    return res.status(200).json(data)
  }

  if (req.method === 'POST') {
    const body = bodySchema.safeParse(req.body)
    if (!body.success) return res.status(400).json({ error: { message: body.error.message } })

    const { data, error } = await createAlertIssueType({ projectRef: ref, ...body.data })
    if (error)
      return res.status(getProxyErrorStatus(error)).json({ error: { message: error.message } })
    return res.status(201).json(data)
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res
    .status(405)
    .json({ data: null, error: { message: `Method ${req.method} Not Allowed` } })
}

const webHandler = toWebHandler(nextHandler)

export const Route = createFileRoute('/api/platform/projects/$ref/alerts/issue-types/')({
  server: { handlers: { GET: webHandler, POST: webHandler } },
})
