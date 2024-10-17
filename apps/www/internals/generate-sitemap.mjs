import { writeFileSync } from 'fs'
import { globby } from 'globby'
import prettier from 'prettier'

/*
 * kudos to leerob from vercel
 * https://leerob.io/blog/nextjs-sitemap-robots
 */

async function generate() {
  const prettierConfig = await prettier.resolveConfig('./.prettierrc.js')

  const pages = await globby([
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
  ])

  const blogUrl = 'blog'
  const caseStudiesUrl = 'case-studies'
  const customerStoriesUrl = 'customers'
  const eventsUrl = 'events'

  const sitemap = `
    <?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${pages
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
          .join('')}
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
