import { API_URL } from 'lib/constants'
import { parseEszip } from 'lib/eszip-parser'
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'POST':
      return handlePost(req, res)
    default:
      return new Response(
        JSON.stringify({ data: null, error: { message: `Method ${method} Not Allowed` } }),
        {
          status: 405,
          headers: { 'Content-Type': 'application/json', Allow: 'POST' },
        }
      )
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { projectRef, slug } = req.body || {}

    if (!projectRef) {
      return res.status(400).json({ error: 'projectRef is required' })
    }
    if (!slug) {
      return res.status(400).json({ error: 'slug is required' })
    }

    // Get authorization token from the request
    const authToken = req.headers.authorization

    if (!authToken) {
      return res.status(401).json({ error: 'No authorization token was found' })
    }

    // Fetch the eszip data
    const headers = new Headers()
    headers.set('Accept', 'application/octet-stream')
    headers.set('Authorization', typeof authToken === 'string' ? authToken : authToken[0])

    // Forward other important headers
    if (req.headers.cookie) {
      headers.set('Cookie', req.headers.cookie)
    }

    const baseUrl = API_URL?.replace('/platform', '')
    const url = `${baseUrl}/v1/projects/${projectRef}/functions/${slug}/body`

    const response = await fetch(url, {
      method: 'GET',
      headers,
      credentials: 'include',
      referrerPolicy: 'no-referrer-when-downgrade',
    })

    if (!response.ok) {
      const error = await response.json()
      return res.status(response.status).json(error)
    }

    // Verify content type is binary/eszip
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/octet-stream')) {
      return res.status(400).json({
        error:
          'Invalid response: Expected eszip file but received ' + (contentType || 'unknown format'),
      })
    }

    // Get the eszip data as ArrayBuffer
    const arrayBuffer = await response.arrayBuffer()

    if (arrayBuffer.byteLength === 0) {
      return res.status(400).json({ error: 'Invalid eszip: File is empty' })
    }

    const uint8Array = new Uint8Array(arrayBuffer)

    // Parse the eszip file using our utility
    const parsed = await parseEszip(uint8Array)

    return res.status(200).json(parsed)
  } catch (error) {
    console.error('Error processing edge function body:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
