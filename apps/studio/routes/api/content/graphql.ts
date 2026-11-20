import { createFileRoute } from '@tanstack/react-router'
import { NextApiRequest, NextApiResponse } from 'next'

import { toWebHandler } from '@/compat/next/api'

const CONTENT_API_URL = process.env.NEXT_PUBLIC_CONTENT_API_URL!

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
  }

  try {
    const response = await fetch(CONTENT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    })

    const data = await response.json()
    return res.status(response.status).json(data)
  } catch (error) {
    console.error('Content API proxy error:', error)
    return res.status(500).json({ error: 'Failed to reach Content API' })
  }
}

const webHandler = toWebHandler(handler)

export const Route = createFileRoute('/api/content/graphql')({
  server: { handlers: { POST: webHandler } },
})
