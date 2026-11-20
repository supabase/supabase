import { createFileRoute } from '@tanstack/react-router'
import { NextApiRequest, NextApiResponse } from 'next'

import { toWebHandler } from '@/compat/next/api'
import { constructHeaders } from '@/lib/api/apiHelpers'
import { apiWrapper } from '@/lib/api/apiWrapper'
import { DEFAULT_EXPOSED_SCHEMAS } from '@/lib/api/self-hosted/constants'
import { getLints } from '@/lib/api/self-hosted/lints'

const nextHandler = (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      const { data, error } = await getLints({
        headers: constructHeaders(req.headers),
        exposedSchemas: DEFAULT_EXPOSED_SCHEMAS,
      })

      if (error) {
        return res.status(400).json(error)
      } else {
        return res.status(200).json(data)
      }
    default:
      res.setHeader('Allow', ['GET'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const webHandler = toWebHandler(nextHandler)

export const Route = createFileRoute('/api/platform/projects/$ref/run-lints')({
  server: { handlers: { GET: webHandler } },
})
