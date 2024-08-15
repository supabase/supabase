/*
 * kudos to leerob from vercel
 * https://leerob.io/blog/nextjs-sitemap-robots
 */

import { writeFileSync } from 'fs'
import { globby } from 'globby'
import prettier from 'prettier'
import { generateCLIPages } from './files/cli.mjs'
import { generateReferencePages } from './files/reference-lib.mjs'
import { generateAPIPages } from './files/api.mjs'

const referencePages = generateReferencePages()
const cliPages = generateCLIPages()
const apiPages = generateAPIPages()

async function generate() {
  const prettierConfig = await prettier.resolveConfig('./.prettierrc.js')

  const rawPages = await globby([
    // guides
    'docs/*.mdx',
    'pages/**/*.mdx',
    '!pages/404.mdx',
    '!pages/404.tsx',
    '!pages/ref-pages.mdx',
  ])

  const guidePages = rawPages.map((x) => {
    let string = x
    string = string.replace('pages/', '')
    string = string.replace('.mdx', '')
    return string
  })

  // combine the guidePages with the ref pages
  const allPages = guidePages.concat(referencePages, cliPages, apiPages)

  const sitemap = `
    <?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${allPages
          .map((path) => {
            return `
              <url>
                  <loc>${`https://supabase.com/docs/${path}`}</loc>
                  <changefreq>weekly</changefreq>
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

  const sitemapFilePath = `public/sitemap.xml`
  console.log(
    `Total of ${allPages.length} pages in sitemap, located at /apps/docs/${sitemapFilePath}`
  )

  // eslint-disable-next-line no-sync
  writeFileSync(sitemapFilePath, formatted)
}

generate()
