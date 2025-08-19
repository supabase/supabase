import { NextResponse } from 'next/server'

// Lightweight CMS post fetcher without heavy dependencies
export const runtime = 'edge'

export async function GET() {
  try {
    // Simple fetch to CMS without importing heavy modules
    const response = await fetch(
      `https://cms-git-feat-cms-www-blog-supabase.vercel.app/api/posts`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add cache with revalidation
        next: {
          revalidate: 300, // 5 minutes cache
        },
      }
    )

    if (!response.ok) {
      console.log('[cms-blog-posts] Non-OK response:', response.status, response.statusText)
      return NextResponse.json({ posts: [] })
    }

    const contentType = response.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      console.log('[cms-blog-posts] Non-JSON response, content-type:', contentType)
      return NextResponse.json({ posts: [] })
    }

    const data = await response.json()

    return NextResponse.json({
      posts: Array.isArray(data) ? data : [],
      cached: true,
    })
  } catch (error) {
    console.error('[cms-blog-posts] Error fetching CMS posts:', error)
    return NextResponse.json({ posts: [] })
  }
}
