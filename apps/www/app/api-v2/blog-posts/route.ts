import { NextRequest, NextResponse } from 'next/server'

import { getSortedPosts } from '@/lib/posts'

export const revalidate = 30

// Cache for combined posts to avoid re-fetching on every request
let cachedPosts: any[] | null = null
let cacheTimestamp = 0
const CACHE_TTL = 30 * 1000 // 30 seconds

async function getCombinedPosts() {
  const now = Date.now()

  // Return cached posts if still valid
  if (cachedPosts && now - cacheTimestamp < CACHE_TTL) {
    return cachedPosts
  }

  // Get static blog posts
  const staticPosts = getSortedPosts({ directory: '_blog' })

  // Combine and sort by date
  const allPosts = [...staticPosts].sort((a: any, b: any) => {
    const dateA = new Date(a.date || a.formattedDate).getTime()
    const dateB = new Date(b.date || b.formattedDate).getTime()
    return dateB - dateA
  })

  // Update cache
  cachedPosts = allPosts
  cacheTimestamp = now

  return allPosts
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const limit = parseInt(searchParams.get('limit') || '25', 10)
    const category = searchParams.get('category')
    const search = searchParams.get('q')

    let posts = await getCombinedPosts()

    // Apply category filter
    if (category && category !== 'all') {
      posts = posts.filter((post: any) => post.categories?.includes(category))
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase()
      posts = posts.filter((post: any) => {
        return (
          post.tags?.join(' ').replaceAll('-', ' ').includes(searchLower) ||
          post.title?.toLowerCase().includes(searchLower) ||
          post.author?.toLowerCase().includes(searchLower)
        )
      })
    }

    const total = posts.length
    const paginatedPosts = posts.slice(offset, offset + limit)
    const hasMore = offset + limit < total

    return NextResponse.json({
      success: true,
      posts: paginatedPosts,
      total,
      offset,
      limit,
      hasMore,
    })
  } catch (error) {
    console.error('[blog-posts] Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
