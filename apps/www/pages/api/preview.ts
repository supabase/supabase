import { NextApiRequest, NextApiResponse } from 'next'
import { getCMSPostBySlug } from '../../lib/cms-posts'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug, secret } = req.query

  // Check the secret and slug parameters
  // You should set PREVIEW_SECRET in your environment variables for security
  if (secret && secret !== process.env.PREVIEW_SECRET) {
    return res.status(401).json({ message: 'Invalid token' })
  }

  // Check if the slug exists
  if (!slug) {
    return res.status(400).json({ message: 'Missing slug parameter' })
  }

  try {
    // Fetch the post with preview flag set to true to get draft content
    const post = await getCMSPostBySlug(String(slug), true)

    if (!post) {
      return res.status(404).json({ message: 'Post not found' })
    }

    // Enable Draft Mode by setting the cookie
    res.setDraftMode({ enable: true })

    // Set headers to prevent caching in draft mode
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')

    // Redirect to the blog post page with draft mode enabled
    res.redirect(`/blog/${post.slug}`)
  } catch (error) {
    console.error('[Preview API] Error enabling preview:', error)
    return res.status(500).json({ message: 'Error enabling preview mode' })
  }
}
