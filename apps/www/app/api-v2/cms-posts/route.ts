import { draftMode } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { CMS_SITE_ORIGIN } from '~/lib/constants'
import { generateReadingTime } from '~/lib/helpers'

// Lightweight runtime for better performance
export const runtime = 'edge'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const cfHeaders = {
  'CF-Access-Client-Id': process.env.CF_ACCESS_CLIENT_ID ?? '',
  'CF-Access-Client-Secret': process.env.CF_ACCESS_CLIENT_SECRET ?? '',
}

// Lightweight TOC generation for edge runtime
type TocItem = { content: string; slug: string; lvl: number }

function generateTocFromMarkdown(markdown: string, maxDepth: number = 2) {
  const lines = markdown.split(/\r?\n/)
  const items: TocItem[] = []

  for (const line of lines) {
    const match = /^(#{1,6})\s+(.*)$/.exec(line)
    if (!match) continue
    const depth = match[1].length
    if (depth > maxDepth) continue
    const text = match[2].trim()
    if (!text) continue

    const slug = text
      .trim()
      .toLowerCase()
      .replace(/[`~!@#$%^&*()+=|{}\[\]\\:\";'<>?,./]+/g, '')
      .replace(/\s+/g, '-')

    items.push({ content: text, slug, lvl: depth })
  }

  const content = items
    .map((h) => `${'  '.repeat(Math.max(0, h.lvl - 1))}- [${h.content}](#${h.slug})`)
    .join('\n')

  return { content, json: items }
}

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

// Handle preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mode = searchParams.get('mode') || 'preview' // 'preview' or 'full'
    const limit = searchParams.get('limit') || '100'
    const slug = searchParams.get('slug') // For fetching specific post
    const draftParam = searchParams.get('draft') === 'true' // Explicit draft parameter

    const baseUrl = CMS_SITE_ORIGIN
    const apiKey = process.env.CMS_API_KEY

    // Check if we're in draft mode (either Next.js draft mode OR explicit draft parameter)
    const { isEnabled: isDraftMode } = await draftMode()
    const shouldFetchDraft = isDraftMode || draftParam

    // When fetching a specific post, we need to handle versioning correctly
    if (slug) {
      // If in draft mode, fetch the latest version (draft or published)
      if (shouldFetchDraft) {
        // Strategy 1: Try to get the latest version from versions API (including drafts)
        const allVersionsUrl = new URL('/api/posts/versions', baseUrl)
        allVersionsUrl.searchParams.set('where[version.slug][equals]', slug)
        allVersionsUrl.searchParams.set('sort', '-updatedAt') // Get the most recent version regardless of status
        allVersionsUrl.searchParams.set('limit', '1')
        allVersionsUrl.searchParams.set('depth', '2')

        const allVersionsResponse = await fetch(allVersionsUrl.toString(), {
          headers: {
            'Content-Type': 'application/json',
            ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
            ...cfHeaders,
          },
          cache: 'no-store',
        })

        if (allVersionsResponse.ok) {
          const versionsData = await allVersionsResponse.json()

          if (versionsData.docs && versionsData.docs.length > 0) {
            const latestVersion = versionsData.docs[0].version
            if (latestVersion) {
              const markdownContent = convertRichTextToMarkdown(latestVersion.content)
              const readingTime = generateReadingTime(richTextToPlainText(latestVersion.content))

              const tocResult = generateTocFromMarkdown(
                markdownContent,
                latestVersion.toc_depth || 3
              )

              const processedPost = {
                slug: latestVersion.slug || '',
                title: latestVersion.title || '',
                description: latestVersion.description || '',
                date: latestVersion.date || new Date().toISOString(),
                formattedDate: new Date(latestVersion.date || new Date()).toLocaleDateString(
                  'en-US',
                  {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  }
                ),
                readingTime,
                authors: Array.isArray(latestVersion.authors)
                  ? latestVersion.authors.map((a: any) => ({
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
                imgThumb: latestVersion.imgThumb?.url
                  ? `${baseUrl}${latestVersion.imgThumb.url}`
                  : undefined,
                imgSocial: latestVersion.imgSocial?.url
                  ? `${baseUrl}${latestVersion.imgSocial.url}`
                  : undefined,
                meta: latestVersion.meta || null,
                url: `/blog/${latestVersion.slug}`,
                path: `/blog/${latestVersion.slug}`,
                tags: latestVersion.tags || [],
                categories: [],
                isCMS: true,
                content: markdownContent,
                richContent: latestVersion.content,
                toc: tocResult,
                toc_depth: latestVersion.toc_depth || 3,
                isDraft: true,
                _status: latestVersion._status,
              }

              return NextResponse.json(
                {
                  success: true,
                  post: processedPost,
                  mode,
                  isDraft: shouldFetchDraft,
                },
                { headers: corsHeaders }
              )
            }
          }
        }

        // Strategy 2: Try to get the most recent draft
        const draftUrl = new URL('/api/posts', baseUrl)
        draftUrl.searchParams.set('where[slug][equals]', slug)
        draftUrl.searchParams.set('depth', '2')
        draftUrl.searchParams.set('draft', 'true')
        draftUrl.searchParams.set('sort', '-updatedAt') // Get the most recent version

        const draftResponse = await fetch(draftUrl.toString(), {
          headers: {
            'Content-Type': 'application/json',
            ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
            ...cfHeaders,
          },
          cache: 'no-store', // Never cache draft content
        })

        if (draftResponse.ok) {
          const draftData = await draftResponse.json()

          if (draftData.docs && draftData.docs.length > 0) {
            const post = draftData.docs[0]
            const markdownContent = convertRichTextToMarkdown(post.content)
            const readingTime = generateReadingTime(richTextToPlainText(post.content))

            const tocResult = generateTocFromMarkdown(markdownContent, post.toc_depth || 3)

            const processedPost = {
              slug: post.slug || '',
              title: post.title || '',
              description: post.description || '',
              date: post.date || new Date().toISOString(),
              formattedDate: new Date(post.date || new Date()).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              }),
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
              imgThumb: post.imgThumb?.url ? `${baseUrl}${post.imgThumb.url}` : undefined,
              imgSocial: post.imgSocial?.url ? `${baseUrl}${post.imgSocial.url}` : undefined,
              meta: post.meta || null,
              url: `/blog/${post.slug}`,
              path: `/blog/${post.slug}`,
              tags: post.tags || [],
              categories: [],
              isCMS: true,
              content: markdownContent,
              richContent: post.content,
              toc: tocResult,
              toc_depth: post.toc_depth || 3,
              isDraft: true,
              _status: post._status,
            }

            return NextResponse.json(
              {
                success: true,
                post: processedPost,
                mode,
                isDraft: shouldFetchDraft,
              },
              { headers: corsHeaders }
            )
          }
        }

        // Strategy 3: If no draft found, try published version but still mark as draft mode

        const publishedUrl = new URL('/api/posts', baseUrl)
        publishedUrl.searchParams.set('where[slug][equals]', slug)
        publishedUrl.searchParams.set('depth', '2')
        publishedUrl.searchParams.set('draft', 'false')

        const publishedResponse = await fetch(publishedUrl.toString(), {
          headers: {
            'Content-Type': 'application/json',
            ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
            ...cfHeaders,
          },
          cache: 'no-store',
        })

        if (publishedResponse.ok) {
          const publishedData = await publishedResponse.json()
          if (publishedData.docs && publishedData.docs.length > 0) {
            const post = publishedData.docs[0]
            const markdownContent = convertRichTextToMarkdown(post.content)
            const readingTime = generateReadingTime(richTextToPlainText(post.content))

            const tocResult = generateTocFromMarkdown(markdownContent, post.toc_depth || 3)

            const processedPost = {
              slug: post.slug || '',
              title: post.title || '',
              description: post.description || '',
              date: post.date || new Date().toISOString(),
              formattedDate: new Date(post.date || new Date()).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              }),
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
              imgThumb: post.imgThumb?.url ? `${baseUrl}${post.imgThumb.url}` : undefined,
              imgSocial: post.imgSocial?.url ? `${baseUrl}${post.imgSocial.url}` : undefined,
              meta: post.meta || null,
              url: `/blog/${post.slug}`,
              path: `/blog/${post.slug}`,
              tags: post.tags || [],
              categories: [],
              isCMS: true,
              content: markdownContent,
              richContent: post.content,
              toc: tocResult,
              toc_depth: post.toc_depth || 3,
              isDraft: true,
              _status: post._status,
            }

            return NextResponse.json(
              {
                success: true,
                post: processedPost,
                mode,
                isDraft: shouldFetchDraft,
              },
              { headers: corsHeaders }
            )
          }
        }
      }

      // Strategy 1: Try to get the latest published version using the versions API
      const versionsUrl = new URL('/api/posts/versions', baseUrl)
      versionsUrl.searchParams.set('where[version.slug][equals]', slug)
      versionsUrl.searchParams.set('where[version._status][equals]', 'published')
      versionsUrl.searchParams.set('sort', '-createdAt') // Use createdAt instead of updatedAt for versions
      versionsUrl.searchParams.set('limit', '1')
      versionsUrl.searchParams.set('depth', '2')

      const versionsResponse = await fetch(versionsUrl.toString(), {
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
          ...cfHeaders,
        },
        // For published posts: allow caching with revalidation
        next: { revalidate: 60 }, // 1 minute
      })

      if (versionsResponse.ok) {
        const versionsData = await versionsResponse.json()

        if (versionsData.docs && versionsData.docs.length > 0) {
          const latestPublishedVersion = versionsData.docs[0].version

          if (latestPublishedVersion) {
            const post = latestPublishedVersion
            const markdownContent = convertRichTextToMarkdown(post.content)
            const plain = richTextToPlainText(post.content)
            const readingTime = generateReadingTime(plain)
            const tocResult = generateTocFromMarkdown(markdownContent, post.toc_depth || 3)

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
              imgThumb: post.imgThumb?.url
                ? typeof post.imgThumb.url === 'string' && post.imgThumb.url.includes('http')
                  ? post.imgThumb.url
                  : `${baseUrl}${post.imgThumb.url}`
                : '',
              imgSocial: post.imgSocial?.url
                ? typeof post.imgSocial.url === 'string' && post.imgSocial.url.includes('http')
                  ? post.imgSocial.url
                  : `${baseUrl}${post.imgSocial.url}`
                : undefined,
              meta: post.meta || null,
              url: `/blog/${post.slug}`,
              path: `/blog/${post.slug}`,
              tags: post.tags || [],
              categories: [],
              isCMS: true,
              content: mode === 'full' ? markdownContent : undefined,
              richContent: mode === 'full' ? post.content : undefined,
              toc: tocResult,
              toc_depth: post.toc_depth || 3,
            }

            return NextResponse.json(
              {
                success: true,
                post: processedPost,
                mode,
                source: 'versions-api',
              },
              { headers: corsHeaders }
            )
          }
        }
      } else {
        if (process.env.NODE_ENV !== 'production') {
          console.log('[cms-posts] Versions API failed, response:', await versionsResponse.text())
        }
      }

      // Strategy 2: If versions API didn't work, try finding the parent post first, then get its latest published version

      const parentUrl = new URL('/api/posts', baseUrl)
      parentUrl.searchParams.set('where[slug][equals]', slug)
      parentUrl.searchParams.set('limit', '1')
      parentUrl.searchParams.set('depth', '0') // Just get the ID

      const parentResponse = await fetch(parentUrl.toString(), {
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
          ...cfHeaders,
        },
        next: { revalidate: 60 }, // 1 minute for published posts
      })

      if (parentResponse.ok) {
        const parentData = await parentResponse.json()
        if (parentData.docs && parentData.docs.length > 0) {
          const parentId = parentData.docs[0].id

          // Now get the latest published version of this specific post
          const versionsByParentUrl = new URL('/api/posts/versions', baseUrl)
          versionsByParentUrl.searchParams.set('where[parent][equals]', parentId)
          versionsByParentUrl.searchParams.set('where[version._status][equals]', 'published')
          versionsByParentUrl.searchParams.set('sort', '-createdAt')
          versionsByParentUrl.searchParams.set('limit', '1')
          versionsByParentUrl.searchParams.set('depth', '2')

          const versionsByParentResponse = await fetch(versionsByParentUrl.toString(), {
            headers: {
              'Content-Type': 'application/json',
              ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
              ...cfHeaders,
            },
            next: { revalidate: 60 }, // 1 minute for published posts
          })

          if (versionsByParentResponse.ok) {
            const versionsByParentData = await versionsByParentResponse.json()

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
                  imgThumb: post.imgThumb?.url
                    ? typeof post.imgThumb.url === 'string' && post.imgThumb.url.includes('http')
                      ? post.imgThumb.url
                      : `${baseUrl}${post.imgThumb.url}`
                    : '',
                  imgSocial: post.imgSocial?.url
                    ? typeof post.imgSocial.url === 'string' && post.imgSocial.url.includes('http')
                      ? post.imgSocial.url
                      : `${baseUrl}${post.imgSocial.url}`
                    : undefined,
                  url: `/blog/${post.slug}`,
                  path: `/blog/${post.slug}`,
                  tags: post.tags || [],
                  categories: [],
                  isCMS: true,
                  content: mode === 'full' ? markdownContent : undefined,
                  richContent: mode === 'full' ? post.content : undefined,
                }

                return NextResponse.json(
                  {
                    success: true,
                    post: processedPost,
                    mode,
                    source: 'versions-by-parent-api',
                  },
                  { headers: corsHeaders }
                )
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
        ...cfHeaders,
      },
      // For individual post requests, don't cache to ensure fresh data
      cache: slug ? 'no-store' : 'default',
      next: slug ? undefined : { revalidate: 300 },
      // Add SSL configuration for production
      ...(process.env.NODE_ENV === 'production' && {
        // Allow self-signed certificates in development, but use proper SSL in production
        // This helps with Vercel's internal networking
        agent: false,
      }),
    })

    if (!response.ok) {
      console.error('[cms-posts] Non-OK response:', response.status, response.statusText)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch posts from CMS',
          status: response.status,
        },
        { status: response.status, headers: corsHeaders }
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
        { status: 502, headers: corsHeaders }
      )
    }

    const data = await response.json()
    const docs = Array.isArray(data?.docs) ? data.docs : []

    const dateFmt: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' }
    const posts = docs
      .filter((p: any) => !!p?.slug)
      .map((p: any) => {
        const imgThumbUrl = p?.imgThumb?.url
          ? typeof p.imgThumb.url === 'string' && p.imgThumb.url.includes('http')
            ? p.imgThumb.url
            : `${baseUrl}${p.imgThumb.url}`
          : ''
        const imgSocialUrl = p?.imgSocial?.url
          ? typeof p.imgSocial.url === 'string' && p.imgSocial.url.includes('http')
            ? p.imgSocial.url
            : `${baseUrl}${p.imgSocial.url}`
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
          imgThumb: imgThumbUrl || imgSocialUrl || '',
          imgSocial: imgSocialUrl || undefined,
          meta: p.meta || null,
          url: `/blog/${p.slug}`,
          path: `/blog/${p.slug}`,
          tags: p.tags || [],
          categories: [],
          isCMS: true,
          toc_depth: p.toc_depth || 3,
        }

        // Add content for full mode
        if (mode === 'full') {
          const markdownContent = convertRichTextToMarkdown(p.content)
          const tocResult = generateTocFromMarkdown(markdownContent, p.toc_depth || 3)
          return {
            ...basePost,
            content: markdownContent, // Convert rich text to markdown for MDX processing
            richContent: p.content, // Keep original rich text for reference
            toc: tocResult,
            toc_depth: p.toc_depth || 3,
          }
        }

        return basePost
      })
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // For single post requests, return the post directly
    if (slug && posts.length > 0) {
      return NextResponse.json(
        {
          success: true,
          post: posts[0],
          mode,
        },
        { headers: corsHeaders }
      )
    }

    return NextResponse.json(
      {
        success: true,
        posts,
        total: posts.length,
        mode,
        cached: true,
      },
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error('[cms-posts] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500, headers: corsHeaders }
    )
  }
}
