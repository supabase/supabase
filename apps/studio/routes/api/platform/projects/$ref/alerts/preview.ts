import { createFileRoute } from '@tanstack/react-router'
import { NextApiRequest, NextApiResponse } from 'next'
import z from 'zod/v4'

import { toWebHandler } from '@/compat/next/api'
import { apiWrapper } from '@/lib/api/apiWrapper'
import { getProxyErrorStatus, previewAlertRule } from '@/lib/api/self-hosted/alert-issues'

const bodySchema = z.object({
  lql: z.string().trim().min(1),
  from: z.string().optional(),
  to: z.string().optional(),
})

const nextHandler = (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res
      .status(405)
      .json({ data: null, error: { message: `Method ${req.method} Not Allowed` } })
  }

  const body = bodySchema.safeParse(req.body)
  if (!body.success) return res.status(400).json({ error: { message: body.error.message } })

  const { data, error } = await previewAlertRule(body.data)

  if (error)
    return res.status(getProxyErrorStatus(error)).json({ error: { message: error.message } })
  return res.status(200).json(data)
}

const webHandler = toWebHandler(nextHandler)

export const Route = createFileRoute('/api/platform/projects/$ref/alerts/preview')({
  server: { handlers: { POST: webHandler } },
})
