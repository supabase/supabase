import { NextRequest, NextResponse } from 'next/server'
import { CMS_SITE_ORIGIN } from '~/lib/constants'
import { generateReadingTime } from '~/lib/helpers'

// Lightweight runtime for better performance
export const runtime = 'edge'

// Minimal rich-text to plain text for reading time
function richTextToPlainText(content: any): string {
  try {
    const blocks = content?.root?.children
    if (!Array.isArray(blocks)) return ''
    const segments: string[] = []
    for (const node of blocks) {
      if (node?.type === 'heading') {
        const text = Array.isArray(node.children)
          ? node.children.map((c: any) => c?.text || '').join('')
          : ''
        if (text) segments.push(text)
      } else if (node?.type === 'paragraph') {
        const text = Array.isArray(node.children)
          ? node.children.map((c: any) => c?.text || '').join('')
          : ''
        if (text) segments.push(text)
      } else if (node?.type === 'list') {
        const items = Array.isArray(node.children)
          ? node.children
              .map((item: any) =>
                Array.isArray(item?.children)
                  ? item.children.map((c: any) => c?.text || '').join('')
                  : ''
              )
              .filter(Boolean)
          : []
        if (items.length > 0) segments.push(items.join(' '))
      } else if (node?.type === 'link') {
        const text = Array.isArray(node.children)
          ? node.children.map((c: any) => c?.text || '').join('')
          : ''
        if (text) segments.push(text)
      }
    }
    return segments.join('\n')
  } catch {
    return ''
  }
}

// Convert Payload rich text content to markdown
function convertRichTextToMarkdown(content: any): string {
  if (!content?.root?.children) return ''

  return content.root.children
    .map((node: any) => {
      if (node.type === 'heading') {
        const level = node.tag && typeof node.tag === 'string' ? node.tag.replace('h', '') : '1'
        const text = node.children?.map((child: any) => child.text).join('') || ''
        return `${'#'.repeat(Number(level))} ${text}`
      }
      if (node.type === 'paragraph') {
        return node.children?.map((child: any) => child.text).join('') || ''
      }
      if (node.type === 'list') {
        const items = node.children
          ?.map((item: any) => {
            if (item.type === 'list-item') {
              return `- ${item.children?.map((child: any) => child.text).join('') || ''}`
            }
            return ''
          })
          .filter(Boolean)
          .join('\n')
        return items
      }
      if (node.type === 'link') {
        const text = node.children?.map((child: any) => child.text).join('') || ''
        const url = node.url || ''
        return `[${text}](${url})`
      }
      return ''
    })
    .filter(Boolean)
    .join('\n\n')
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mode = searchParams.get('mode') || 'preview' // 'preview' or 'full'
    const limit = searchParams.get('limit') || '100'
    const slug = searchParams.get('slug') // For fetching specific post

    const baseUrl = CMS_SITE_ORIGIN
    const apiKey = process.env.PAYLOAD_API_KEY || process.env.CMS_READ_KEY

    // When fetching a specific post, we need to handle versioning correctly
    if (slug) {
      // Strategy 1: Try to get the latest published version using the versions API
      const versionsUrl = new URL('/api/posts/versions', baseUrl)
      versionsUrl.searchParams.set('where[version.slug][equals]', slug)
      versionsUrl.searchParams.set('where[version._status][equals]', 'published')
      versionsUrl.searchParams.set('sort', '-createdAt') // Use createdAt instead of updatedAt for versions
      versionsUrl.searchParams.set('limit', '1')
      versionsUrl.searchParams.set('depth', '2')

      console.log('[cms-posts] Trying versions API:', versionsUrl.toString())

      const versionsResponse = await fetch(versionsUrl.toString(), {
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        // Force fresh data, no caching for individual post requests
        cache: 'no-store',
      })

      console.log('[cms-posts] Versions API response status:', versionsResponse.status)

      if (versionsResponse.ok) {
        const versionsData = await versionsResponse.json()
        console.log('[cms-posts] Versions API data:', {
          totalDocs: versionsData.totalDocs,
          docsLength: versionsData.docs?.length,
          firstDocId: versionsData.docs?.[0]?.id,
          firstDocCreatedAt: versionsData.docs?.[0]?.createdAt,
          versionStatus: versionsData.docs?.[0]?.version?._status,
          versionSlug: versionsData.docs?.[0]?.version?.slug,
        })

        if (versionsData.docs && versionsData.docs.length > 0) {
          const latestPublishedVersion = versionsData.docs[0].version

          if (latestPublishedVersion) {
            const post = latestPublishedVersion
            const markdownContent = convertRichTextToMarkdown(post.content)
            const plain = richTextToPlainText(post.content)
            const readingTime = generateReadingTime(plain)

            const processedPost = {
              type: 'blog' as const,
              slug: post.slug,
              title: post.title || '',
              description: post.description || '',
              date: post.date || post.createdAt || new Date().toISOString(),
              formattedDate: new Date(post.date || post.createdAt || new Date()).toLocaleDateString(
                'en-IN',
                { month: 'long', day: 'numeric', year: 'numeric' }
              ),
              readingTime,
              authors: Array.isArray(post.authors)
                ? post.authors.map((a: any) => ({
                    author: a?.author || 'Unknown Author',
                    author_id: a?.author_id || '',
                    position: a?.position || '',
                    author_url: a?.author_url || '#',
                    author_image_url: a?.author_image_url?.url
                      ? typeof a.author_image_url.url === 'string' &&
                        a.author_image_url.url.includes('http')
                        ? a.author_image_url.url
                        : `${baseUrl}${a.author_image_url.url}`
                      : null,
                    username: a?.username || '',
                  }))
                : [],
              thumb: post.thumb?.url
                ? typeof post.thumb.url === 'string' && post.thumb.url.includes('http')
                  ? post.thumb.url
                  : `${baseUrl}${post.thumb.url}`
                : '',
              image: post.image?.url
                ? typeof post.image.url === 'string' && post.image.url.includes('http')
                  ? post.image.url
                  : `${baseUrl}${post.image.url}`
                : undefined,
              url: `/blog/${post.slug}`,
              path: `/blog/${post.slug}`,
              tags: post.tags || [],
              categories: [],
              isCMS: true,
              content: mode === 'full' ? markdownContent : undefined,
              richContent: mode === 'full' ? post.content : undefined,
            }

            return NextResponse.json({
              success: true,
              post: processedPost,
              mode,
              source: 'versions-api',
            })
          }
        }
      } else {
        console.log('[cms-posts] Versions API failed, response:', await versionsResponse.text())
      }

      // Strategy 2: If versions API didn't work, try finding the parent post first, then get its latest published version
      console.log('[cms-posts] Trying Strategy 2: Find parent post first')

      const parentUrl = new URL('/api/posts', baseUrl)
      parentUrl.searchParams.set('where[slug][equals]', slug)
      parentUrl.searchParams.set('limit', '1')
      parentUrl.searchParams.set('depth', '0') // Just get the ID

      const parentResponse = await fetch(parentUrl.toString(), {
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        cache: 'no-store',
      })

      if (parentResponse.ok) {
        const parentData = await parentResponse.json()
        if (parentData.docs && parentData.docs.length > 0) {
          const parentId = parentData.docs[0].id
          console.log('[cms-posts] Found parent post ID:', parentId)

          // Now get the latest published version of this specific post
          const versionsByParentUrl = new URL('/api/posts/versions', baseUrl)
          versionsByParentUrl.searchParams.set('where[parent][equals]', parentId)
          versionsByParentUrl.searchParams.set('where[version._status][equals]', 'published')
          versionsByParentUrl.searchParams.set('sort', '-createdAt')
          versionsByParentUrl.searchParams.set('limit', '1')
          versionsByParentUrl.searchParams.set('depth', '2')

          console.log('[cms-posts] Trying versions by parent ID:', versionsByParentUrl.toString())

          const versionsByParentResponse = await fetch(versionsByParentUrl.toString(), {
            headers: {
              'Content-Type': 'application/json',
              ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
            },
            cache: 'no-store',
          })

          if (versionsByParentResponse.ok) {
            const versionsByParentData = await versionsByParentResponse.json()
            console.log('[cms-posts] Versions by parent data:', {
              totalDocs: versionsByParentData.totalDocs,
              docsLength: versionsByParentData.docs?.length,
              firstDocCreatedAt: versionsByParentData.docs?.[0]?.createdAt,
            })

            if (versionsByParentData.docs && versionsByParentData.docs.length > 0) {
              const latestPublishedVersion = versionsByParentData.docs[0].version

              if (latestPublishedVersion) {
                const post = latestPublishedVersion
                const markdownContent = convertRichTextToMarkdown(post.content)
                const plain = richTextToPlainText(post.content)
                const readingTime = generateReadingTime(plain)

                const processedPost = {
                  type: 'blog' as const,
                  slug: post.slug,
                  title: post.title || '',
                  description: post.description || '',
                  date: post.date || post.createdAt || new Date().toISOString(),
                  formattedDate: new Date(
                    post.date || post.createdAt || new Date()
                  ).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' }),
                  readingTime,
                  authors: Array.isArray(post.authors)
                    ? post.authors.map((a: any) => ({
                        author: a?.author || 'Unknown Author',
                        author_id: a?.author_id || '',
                        position: a?.position || '',
                        author_url: a?.author_url || '#',
                        author_image_url: a?.author_image_url?.url
                          ? typeof a.author_image_url.url === 'string' &&
                            a.author_image_url.url.includes('http')
                            ? a.author_image_url.url
                            : `${baseUrl}${a.author_image_url.url}`
                          : null,
                        username: a?.username || '',
                      }))
                    : [],
                  thumb: post.thumb?.url
                    ? typeof post.thumb.url === 'string' && post.thumb.url.includes('http')
                      ? post.thumb.url
                      : `${baseUrl}${post.thumb.url}`
                    : '',
                  image: post.image?.url
                    ? typeof post.image.url === 'string' && post.image.url.includes('http')
                      ? post.image.url
                      : `${baseUrl}${post.image.url}`
                    : undefined,
                  url: `/blog/${post.slug}`,
                  path: `/blog/${post.slug}`,
                  tags: post.tags || [],
                  categories: [],
                  isCMS: true,
                  content: mode === 'full' ? markdownContent : undefined,
                  richContent: mode === 'full' ? post.content : undefined,
                }

                return NextResponse.json({
                  success: true,
                  post: processedPost,
                  mode,
                  source: 'versions-by-parent-api',
                })
              }
            }
          }
        }
      }
    }

    // Fallback to regular posts API for listing or if versions API fails
    const url = new URL('/api/posts', baseUrl)
    url.searchParams.set('depth', '2')
    url.searchParams.set('draft', 'false')
    url.searchParams.set('limit', limit)
    url.searchParams.set('where[_status][equals]', 'published')

    // If fetching specific post by slug (fallback)
    if (slug) {
      url.searchParams.set('where[slug][equals]', slug)
      url.searchParams.set('limit', '1')
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      // For individual post requests, don't cache to ensure fresh data
      cache: slug ? 'no-store' : 'default',
      next: slug ? undefined : { revalidate: 300 },
    })

    if (!response.ok) {
      console.error('[cms-posts] Non-OK response:', response.status, response.statusText)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch posts from CMS',
          status: response.status,
        },
        { status: response.status }
      )
    }

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.toLowerCase().includes('application/json')) {
      console.error('[cms-posts] Non-JSON response, content-type:', contentType)
      return NextResponse.json(
        {
          success: false,
          error: 'CMS returned non-JSON response',
          contentType,
        },
        { status: 502 }
      )
    }

    const data = await response.json()
    const docs = Array.isArray(data?.docs) ? data.docs : []

    const dateFmt: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' }
    const posts = docs
      .filter((p: any) => !!p?.slug)
      .map((p: any) => {
        const thumbUrl = p?.thumb?.url
          ? typeof p.thumb.url === 'string' && p.thumb.url.includes('http')
            ? p.thumb.url
            : `${baseUrl}${p.thumb.url}`
          : ''
        const imageUrl = p?.image?.url
          ? typeof p.image.url === 'string' && p.image.url.includes('http')
            ? p.image.url
            : `${baseUrl}${p.image.url}`
          : ''
        const date = p.date || p.createdAt || new Date().toISOString()
        const formattedDate = new Date(date).toLocaleDateString('en-IN', dateFmt)
        const plain = richTextToPlainText(p?.content)
        const readingTime = generateReadingTime(plain)

        const authors = Array.isArray(p?.authors)
          ? p.authors.map((a: any) => ({
              author: a?.author || 'Unknown Author',
              author_id: a?.author_id || '',
              position: a?.position || '',
              author_url: a?.author_url || '#',
              author_image_url: a?.author_image_url?.url
                ? typeof a.author_image_url.url === 'string' &&
                  a.author_image_url.url.includes('http')
                  ? a.author_image_url.url
                  : `${baseUrl}${a.author_image_url.url}`
                : null,
              username: a?.username || '',
            }))
          : []

        // Base post structure (always included)
        const basePost = {
          type: 'blog' as const,
          slug: p.slug,
          title: p.title || '',
          description: p.description || '',
          date,
          formattedDate,
          readingTime,
          authors,
          thumb: thumbUrl || imageUrl || '',
          image: imageUrl || undefined,
          url: `/blog/${p.slug}`,
          path: `/blog/${p.slug}`,
          tags: p.tags || [],
          categories: [],
          isCMS: true,
        }

        // Add content for full mode
        if (mode === 'full') {
          const markdownContent = convertRichTextToMarkdown(p.content)
          return {
            ...basePost,
            content: markdownContent, // Convert rich text to markdown for MDX processing
            richContent: p.content, // Keep original rich text for reference
          }
        }

        return basePost
      })
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // For single post requests, return the post directly
    if (slug && posts.length > 0) {
      return NextResponse.json({
        success: true,
        post: posts[0],
        mode,
      })
    }

    return NextResponse.json({
      success: true,
      posts,
      total: posts.length,
      mode,
      cached: true,
    })
  } catch (error) {
    console.error('[cms-posts] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
