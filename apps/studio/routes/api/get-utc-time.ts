import { createFileRoute } from '@tanstack/react-router'
import { NextApiRequest, NextApiResponse } from 'next'

import { toWebHandler } from '@/compat/next/api'

// Returns the current UTC time in ISO format. Used to check if the client and server time are skewed. Clock skew causes
// issues with JWT verification.
const handler = async (_req: NextApiRequest, res: NextApiResponse) => {
  const utcTime = new Date().toISOString()

  return res.status(200).json({ utcTime })
}

const webHandler = toWebHandler(handler)

export const Route = createFileRoute('/api/get-utc-time')({
  server: { handlers: { GET: webHandler } },
})
