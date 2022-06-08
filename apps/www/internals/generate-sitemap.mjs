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
    'pages/*/*.tsx',
    'data/**/*.mdx',
    '_blog/*.mdx',
    '_alternatives/*.mdx',
    '!pages/index.tsx',
    '!data/*.mdx',
    '!pages/_*.js',
    '!pages/*/index.tsx',
    '!pages/api',
    '!pages/404.js',
  ])

  const sitemap = `
    <?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${pages
          .filter((page) => !page.includes('_document.tsx'))
          .map((page) => {
            const path = page
              .replace('pages', '')
              // add a `/` for blog posts
              .replace('_blog', '/blog')
              .replace('_alternatives', '/alternatives')
              .replace('.tsx', '')
              .replace('.mdx', '')
              // replace the paths for nested 'index' based routes
              .replace('/auth/Auth', '/auth')
              .replace('/database/Database', '/database')
              .replace('/storage/Storage', '/storage')

            let route = path === '/index' ? '' : path

            if (route === '/alternatives/[slug]') return null
            if (route === '/partners/[slug]') return null

            //
            // blog specific urls
            //
            if (route.includes('/blog/')) {
              // clean blog post route from string
              const _route = route.replace('/blog/', '')
              // splut the url
              let split = _route.split('')
              // target and replace the `-` between dates
              split[4] = '/'
              split[7] = '/'
              split[10] = '/'
              // reconstruct the url
              route = '/blog/' + split.join('')
            }

            return `
              <url>
                  <loc>${`https://supabase.com${route}`}</loc>
                  <changefreq>weekly</changefreq>
                  <changefreq>0.5</changefreq>
              </url>
            `
          })
          .join('')}
    </urlset>
    `

  const formatted = prettier.format(sitemap, {
    ...prettierConfig,
    parser: 'html',
  })

  // eslint-disable-next-line no-sync
  writeFileSync('public/sitemap_www.xml', formatted)
}

generate()
