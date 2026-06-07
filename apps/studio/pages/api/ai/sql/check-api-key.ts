import { NextApiRequest, NextApiResponse } from 'next'

// [console fork] Reports whether the AI assistant's OpenAI key is configured.
// The original used apiWrapper({ withAuth: true }), which validates via GoTrue
// and hangs in our better-auth setup. This only exposes a boolean, same-origin
// behind the dashboard session.
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: { message: `Method ${req.method} Not Allowed` } })
  }
  return res.status(200).json({ hasKey: !!process.env.OPENAI_API_KEY })
}
