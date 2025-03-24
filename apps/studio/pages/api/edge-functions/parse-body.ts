import { NextApiRequest, NextApiResponse } from 'next'
import path from 'path'
import { parseEszip } from 'lib/eszip-parser'

// Configure API route to handle raw binary data
export const config = {
  api: {
    bodyParser: false,
  },
}

// Helper to get raw body as ArrayBuffer
async function getRawBody(req: NextApiRequest): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = []

    req.on('data', (chunk: Buffer) => {
      chunks.push(new Uint8Array(chunk))
    })

    req.on('end', () => {
      // Combine all chunks into a single ArrayBuffer
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
      const result = new Uint8Array(totalLength)
      let offset = 0
      for (const chunk of chunks) {
        result.set(chunk, offset)
        offset += chunk.length
      }
      resolve(result.buffer)
    })

    req.on('error', reject)
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get the raw body as ArrayBuffer
    const arrayBuffer = await getRawBody(req)
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      return res.status(400).json({ error: 'Request body is required' })
    }

    // Convert ArrayBuffer directly to Uint8Array
    const uint8Array = new Uint8Array(arrayBuffer)

    // Parse the eszip file using our utility
    const files = await parseEszip(uint8Array)

    return res.status(200).json({
      files,
    })
  } catch (error) {
    console.error('Error processing edge function body:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
