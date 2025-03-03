import apiWrapper from 'lib/api/apiWrapper'
import { NextApiRequest, NextApiResponse } from 'next'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGet(req, res)
    default:
      res.setHeader('Allow', ['GET'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const projectRef = req.headers['x-project'] as string

  if (!projectRef) {
    return res.status(400).json({ error: 'Project reference is required' })
  }

  try {
    const response = await fetch(
      `https://api.logflare.app/api/endpoints/query/exposed%20service_role%20advisor%20hack?project=${projectRef}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'X-API-KEY': process.env.LOGFLARE_API_KEY!,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Logflare API responded with status ${response.status}`)
    }

    const data = await response.json()

    return res.json(data.result.length > 0)
  } catch (error) {
    console.error('Error fetching service role key leak data:', error)
    return res.status(500).json({
      error:
        'There was an unknown error fetching the service role key leak data. Please try again.',
    })
  }
}

const wrapper = (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

export default wrapper
