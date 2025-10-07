import { writeFileSync } from 'fs'
import { globby } from 'globby'
import prettier from 'prettier'

/*
 * kudos to leerob from vercel
 * https://leerob.io/blog/nextjs-sitemap-robots
 */

// Constants for CMS integration
const CMS_SITE_ORIGIN =
  process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'
    ? 'https://cms.supabase.com'
    : process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL &&
        typeof process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL === 'string'
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL?.replace('zone-www-dot-com-git-', 'cms-git-')}`
      : 'http://localhost:3030'
const CMS_API_KEY = process.env.CMS_API_KEY

/**
 * Get CMS blog posts for sitemap
 */
const getCMSBlogPosts = async () => {
  try {
    const response = await fetch(
      `${CMS_SITE_ORIGIN}/api/posts?depth=0&draft=false&where[_status][equals]=published&limit=1000`,
      {
        headers: {
          'Content-Type': 'application/json',
          ...(CMS_API_KEY && { Authorization: `Bearer ${CMS_API_KEY}` }),
        },
      }
    )

    if (!response.ok) {
      console.warn(`[getCMSBlogPosts] HTTP error! status: ${response.status}`)
      return []
    }

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.toLowerCase().includes('application/json')) {
      console.warn(`[getCMSBlogPosts] Non-JSON response from CMS`)
      return []
    }

    const data = await response.json()

    const posts = data.docs
      .filter((post) => post.slug && post.title && post._status === 'published')
      .map((post) => ({
        slug: post.slug,
        updatedAt: post.updatedAt || new Date().toISOString(),
      }))

    return posts
  } catch (error) {
    console.warn('Error fetching CMS blog posts for sitemap:', error)
    return []
  }
}

async function generate() {
  const prettierConfig = await prettier.resolveConfig('./.prettierrc.js')

  const unsortedPages = await globby([
    'pages/*.js',
    'pages/*.tsx',
    'pages/*.mdx',
    'pages/**/*.tsx',
    'data/**/*.mdx',
    '_blog/*.mdx',
    '_case-studies/*.mdx',
    '_customers/*.mdx',
    '_events/*.mdx',
    '_alternatives/*.mdx',
    '!data/*.mdx',
    '!pages/_*.js',
    '!pages/_*.tsx',
    '!pages/api',
    '!pages/404.tsx',
    '.next/server/pages/partners/integrations/*.html',
    '.next/server/pages/partners/experts/*.html',
    '.next/server/pages/features/*.html',
  ])

  const pages = unsortedPages.sort((a, b) => a.localeCompare(b))

  // Fetch CMS blog posts
  const cmsBlogPosts = await getCMSBlogPosts()
  console.log(`Found ${cmsBlogPosts.length} CMS blog posts for sitemap`)

  const blogUrl = 'blog'
  const caseStudiesUrl = 'case-studies'
  const customerStoriesUrl = 'customers'
  const eventsUrl = 'events'

  // Generate URLs for static pages
  const staticUrls = pages
    .map((page) => {
      const path = page
        .replace('.next/server/pages', '')
        .replace('pages', '')
        .replace('.html', '')
        // add a `/` for blog posts
        .replace('_blog', `/${blogUrl}`)
        .replace('_case-studies', `/${caseStudiesUrl}`)
        .replace('_customers', `/${customerStoriesUrl}`)
        .replace('_events', `/${eventsUrl}`)
        .replace('_alternatives', '/alternatives')
        .replace('.tsx', '')
        .replace('.mdx', '')
        // replace /{directory}/index with /{directory}
        .replace(/\/([^\/]+)\/index/, '/$1')

      let route = path === '/index' ? '' : path

      if (route === '/alternatives/[slug]') return null
      if (route === '/partners/[slug]') return null
      if (route === '/case-studies/[slug]') return null
      if (route === '/customers/[slug]') return null
      if (route === '/events/[slug]') return null
      if (route === '/features/[slug]') return null
      if (route === '/blog/categories/[category]') return null
      if (route === '/partners/experts/[slug]') return null
      if (route === '/partners/integrations/[slug]') return null
      if (route === '/launch-week/ticket-image') return null
      if (route === '/launch-week/tickets/[username]') return null

      /**
       * Blog based urls
       * handle removal of dates in filename
       */
      if (route.includes(`/${blogUrl}/`)) {
        /**
         * remove directory from route
         */
        const _route = route.replace(`/${blogUrl}/`, '')
        /**
         * remove the date from the file name
         */
        const substring = _route.substring(11)
        /**
         * reconsruct the route
         */
        route = `/${blogUrl}/` + substring
      }

      /**
       * Event based urls
       * handle removal of dates in filename
       */
      if (route.includes(`/${eventsUrl}/`)) {
        // remove finelnames with __
        if (route.includes(`__`)) return null
        /**
         * remove directory from route
         */
        const _route = route.replace(`/${eventsUrl}/`, '')
        /**
         * remove the date from the file name
         */
        const substring = _route.substring(11)
        /**
         * reconsruct the route
         */
        route = `/${eventsUrl}/` + substring
      }

      return `
        <url>
            <loc>${`https://supabase.com${route}`}</loc>
            <changefreq>weekly</changefreq>
            <priority>0.5</priority>
        </url>
      `
    })
    .filter(Boolean)

  // Generate URLs for CMS blog posts
  const cmsBlogUrls = cmsBlogPosts.map((post) => {
    const lastmod = new Date(post.updatedAt).toISOString().split('T')[0]
    return `
      <url>
          <loc>https://supabase.com/blog/${post.slug}</loc>
          <lastmod>${lastmod}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.7</priority>
      </url>
    `
  })

  const sitemap = `
    <?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${[...staticUrls, ...cmsBlogUrls].join('')}
    </urlset>
    `

  const formatted = await prettier.format(sitemap, {
    ...prettierConfig,
    parser: 'html',
  })

  /**
   * generate sitemap router
   *
   * this points to www and docs sitemaps
   */
  const sitemapRouter = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://supabase.com/sitemap_www.xml</loc>
  </sitemap>
  <sitemap>
    <loc>https://supabase.com/docs/sitemap.xml</loc>
  </sitemap>
</sitemapindex>
`

  /**
   * write sitemaps
   */
  // eslint-disable-next-line no-sync
  writeFileSync('public/sitemap.xml', sitemapRouter)
  // eslint-disable-next-line no-sync
  writeFileSync('public/sitemap_www.xml', formatted)
}

generate()
