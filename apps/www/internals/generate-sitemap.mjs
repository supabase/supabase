import { readFileSync, writeFileSync } from 'fs'
import { globby } from 'globby'
import prettier from 'prettier'

import { parseFrontmatter } from '../lib/frontmatter.mjs'

const DATED_COLLECTIONS = ['_blog/', '_alternatives/', '_customers/']
const ISO_DATE_SHAPE =
  /^(\d{4}-\d{2}-\d{2})(?:T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z|[+-](?:[01]\d|2[0-3]):?[0-5]\d)?)?$/
const RSS_PUB_DATE_SHAPE =
  /^[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2}:\d{2} (?:[+-]\d{4}|GMT|UTC)$/

function lastmodError(source, value, hint = '') {
  return new Error(
    `${source}: cannot derive lastmod from date value ${JSON.stringify(value)}${hint}`
  )
}

function toIsoDate(value, source) {
  if (typeof value !== 'string') throw lastmodError(source, value)
  const match = ISO_DATE_SHAPE.exec(value)
  if (!match) throw lastmodError(source, value)
  const candidate = match[1]
  const roundTrip = new Date(`${candidate}T00:00:00Z`)
  if (Number.isNaN(roundTrip.getTime()) || roundTrip.toISOString().slice(0, 10) !== candidate) {
    throw lastmodError(source, value, '; not a real calendar day')
  }
  return candidate
}

function contentLastmod(filePath) {
  const { data } = parseFrontmatter(readFileSync(filePath, 'utf-8'))
  const published = data.date == null ? undefined : toIsoDate(data.date, filePath)
  const updated = data.updated == null ? undefined : toIsoDate(data.updated, filePath)
  if (published && updated && updated < published) {
    throw lastmodError(filePath, data.updated, '; updated is earlier than date')
  }
  return updated ?? published
}

function changelogLastmod(pubDate, link) {
  const source = `changelog-rss ${link}`
  if (!RSS_PUB_DATE_SHAPE.test(pubDate)) throw lastmodError(source, pubDate)
  const instant = new Date(pubDate)
  if (Number.isNaN(instant.getTime())) throw lastmodError(source, pubDate)
  return instant.toISOString().slice(0, 10)
}

function urlEntry(loc, lastmod) {
  return `
        <url>
            <loc>${loc}</loc>
            ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}
            <changefreq>weekly</changefreq>
            <priority>0.5</priority>
        </url>
      `
}

async function generate() {
  const prettierConfig = await prettier.resolveConfig('./.prettierrc.js')

  const unsortedPages = await globby([
    'pages/*.js',
    'pages/*.tsx',
    'pages/*.mdx',
    'pages/**/*.tsx',
    '_blog/*.mdx',
    '_case-studies/*.mdx',
    '_customers/*.mdx',
    '_events/*.mdx',
    '_alternatives/*.mdx',
    '!pages/_*.js',
    '!pages/_*.tsx',
    '!pages/api',
    '!pages/404.tsx',
    '.next/server/pages/partners/integrations/*.html',
    '.next/server/pages/partners/catalog/*.html',
    '.next/server/pages/partners/experts/*.html',
    '.next/server/pages/features/*.html',
  ])

  const pages = unsortedPages.sort((a, b) => a.localeCompare(b))

  const blogUrl = 'blog'
  const caseStudiesUrl = 'case-studies'
  const customerStoriesUrl = 'customers'
  const eventsUrl = 'events'

  // Generate URLs for static pages
  const staticUrls = pages
    .map((page) => {
      const path = page
        .replace('.next/server/pages', '')
        .replace(/^pages/, '')
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
      if (route === '/partners/catalog/[slug]') return null
      if (route === '/launch-week/ticket-image') return null
      if (route === '/launch-week/tickets/[username]') return null
      if (route === '/changelog/[slug]') return null

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

      const lastmod = DATED_COLLECTIONS.some((prefix) => page.startsWith(prefix))
        ? contentLastmod(page)
        : undefined

      return urlEntry(`https://supabase.com${route}`, lastmod)
    })
    .filter(Boolean)

  // Changelog detail pages are dynamic routes; include them from generated changelog RSS links.
  const changelogDetailUrls = (() => {
    let rss
    try {
      rss = readFileSync('public/changelog-rss.xml', 'utf-8')
    } catch {
      return []
    }

    const lastmodByUrl = new Map()
    for (const [, item] of rss.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
      const link = item.match(/<link>(https:\/\/supabase\.com\/changelog\/\d+[^<]*)<\/link>/)?.[1]
      if (!link || lastmodByUrl.has(link)) continue
      const pubDate = item.match(/<pubDate>([^<]*)<\/pubDate>/)?.[1]
      lastmodByUrl.set(link, pubDate ? changelogLastmod(pubDate, link) : undefined)
    }

    return [...lastmodByUrl].map(([url, lastmod]) => urlEntry(url, lastmod))
  })()

  // /evals is a separate app proxied onto supabase.com via a rewrite in lib/rewrites.js,
  // so it has no page file for the globs above to find. Hardcode it here.
  const proxiedAppUrls = [urlEntry('https://supabase.com/evals')]

  const sitemap = `
    <?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${[...staticUrls, ...changelogDetailUrls, ...proxiedAppUrls].join('')}
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
  writeFileSync('public/sitemap.xml', sitemapRouter)
  writeFileSync('public/sitemap_www.xml', formatted)
}

generate()
