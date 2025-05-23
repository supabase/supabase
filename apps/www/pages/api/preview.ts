import { NextApiRequest, NextApiResponse } from 'next'
import { getCMSPostBySlug } from '../../lib/cms-posts'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug, secret } = req.query

  console.log('[Preview API] Request params:', { slug, secret })

  // Check the secret (optional)
  // You could use a site-specific secret to prevent unauthorized preview access
  // if (secret !== process.env.PREVIEW_SECRET) {
  //   return res.status(401).json({ message: 'Invalid token' })
  // }

  // Check if the slug exists
  if (!slug) {
    return res.status(400).json({ message: 'Missing slug parameter' })
  }

  try {
    // Fetch the post with preview flag set to true to get draft content
    const post = await getCMSPostBySlug(String(slug), true)

    if (!post) {
      console.log(`[Preview API] No post found for slug: ${slug}`)
      return res.status(404).json({ message: 'Post not found' })
    }

    console.log(`[Preview API] Found post: ${post.title}, enabling preview mode`)

    // Enable Preview Mode by setting the cookies
    res.setPreviewData({
      slug: post.slug,
      isDraft: true,
    })

    // Redirect to the path from the fetched post
    // We don't redirect to req.query.slug as that might lead to open redirect vulnerabilities
    console.log(`[Preview API] Enabling preview mode for: /blog/${post.slug}`)

    // Redirect to the blog post page with preview mode
    res.redirect(`/blog/${post.slug}`)
  } catch (error) {
    console.error('[Preview API] Error enabling preview:', error)
    return res.status(500).json({ message: 'Error enabling preview mode' })
  }
}
