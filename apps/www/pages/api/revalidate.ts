import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check for secret to confirm this is a valid request
  if (req.query.secret !== process.env.PREVIEW_SECRET) {
    return res.status(401).json({ message: 'Invalid token' })
  }

  const { path } = req.query

  if (!path) {
    return res.status(400).json({ message: 'Missing path parameter' })
  }

  try {
    console.log(`[Revalidate API] Revalidating path: ${path}`)

    // This will revalidate the specific page
    await res.revalidate(String(path))

    console.log(`[Revalidate API] Successfully revalidated: ${path}`)
    return res.json({ revalidated: true, path })
  } catch (error) {
    console.error('[Revalidate API] Error during revalidation:', error)
    return res.status(500).json({
      message: 'Error revalidating',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
