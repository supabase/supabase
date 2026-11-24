/*
 * kudos to leerob from vercel
 * https://leerob.io/blog/nextjs-sitemap-robots
 */

import fs from 'fs'
import { format } from 'oxfmt'

import { getSitemapPages } from './files/sitemap-pages'

async function generate() {
  const allPages = await getSitemapPages()

  const sitemap = `
    <?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${allPages
          .map(({ link, priority }) => {
            const finalPriority = priority ?? 0.8
            return `
              <url>
                  <loc>${`https://supabase.com/docs/${link}`}</loc>
                  <changefreq>weekly</changefreq>
                  <priority>${finalPriority}</priority>
              </url>
            `
          })
          .join('')}
    </urlset>
    `

  const { code: formatted, errors } = await format('sitemap.html', sitemap, {
    tabWidth: 2,
    printWidth: 100,
    endOfLine: 'lf',
  })
  if (errors.length > 0) {
    throw new Error(`Failed to format docs sitemap: ${errors.map((e) => e.message).join('; ')}`)
  }

  const sitemapFilePath = `public/sitemap.xml`
  console.log(
    `Total of ${allPages.length} pages in sitemap, located at /apps/docs/${sitemapFilePath}`
  )

  fs.writeFileSync(sitemapFilePath, formatted)
}

generate()
