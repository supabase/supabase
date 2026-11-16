import assert from 'node:assert'
import { createFileRoute } from '@tanstack/react-router'
import { NextApiRequest, NextApiResponse } from 'next'
import z from 'zod/v4'

import { toWebHandler } from '@/compat/next/api'
import { apiWrapper } from '@/lib/api/apiWrapper'
import {
  createAlertIssueComment,
  getProxyErrorStatus,
  listAlertIssueComments,
} from '@/lib/api/self-hosted/alert-issues'

const bodySchema = z.object({
  body: z.string().trim().min(1).max(5000),
  as_assistant: z.boolean().optional(),
})

const nextHandler = (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { ref, alertIssueId } = req.query
  assert(typeof ref === 'string', 'Invalid or missing ref parameter')
  assert(typeof alertIssueId === 'string', 'Invalid or missing alertIssueId parameter')

  if (req.method === 'GET') {
    const { data, error } = await listAlertIssueComments({ projectRef: ref, alertIssueId })
    if (error)
      return res.status(getProxyErrorStatus(error)).json({ error: { message: error.message } })
    return res.status(200).json(data)
  }

  if (req.method === 'POST') {
    const body = bodySchema.safeParse(req.body)
    if (!body.success) return res.status(400).json({ error: { message: body.error.message } })

    const { data, error } = await createAlertIssueComment({
      projectRef: ref,
      alertIssueId,
      body: body.data.body,
      asAssistant: body.data.as_assistant,
    })
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

export const Route = createFileRoute(
  '/api/platform/projects/$ref/alerts/issues/$alertIssueId/comments'
)({
  server: { handlers: { GET: webHandler, POST: webHandler } },
})
