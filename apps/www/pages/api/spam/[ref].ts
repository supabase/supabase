import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return new Response(
    JSON.stringify({
      message: 'Thank you! We have received your report.',
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}
