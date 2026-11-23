/*
 * kudos to leerob from vercel
 * https://leerob.io/blog/nextjs-sitemap-robots
 */

import fs from 'fs'
import { globby } from 'globby'
import matter from 'gray-matter'
import { format } from 'oxfmt'
import { checkGuidePageEnabled } from '~/features/docs/NavigationPageStatus.utils'

import { generateReferencePages } from './files/reference-lib'

async function generate() {
  const referencePages = await generateReferencePages()

  const contentFiles = await globby(['content/guides/**/!(_)*.mdx'])
  const contentPages = await Promise.all(
    contentFiles.map(async (filePath) => {
      const fileContents = await fs.promises.readFile(filePath, 'utf8')
      const {
        data: { sitemapPriority },
      } = matter(fileContents)

      return {
        link: filePath.replace(/^content\//, '').replace(/\.mdx$/, ''),
        priority: sitemapPriority ?? 0.8,
      }
    })
  )

  const allPages = (contentPages as Array<{ link: string; priority: number }>)
    .filter(({ link }) => checkGuidePageEnabled(`/${link}`))
    .concat(referencePages)
  // Keep the output order stable across builds
  allPages.sort((a, b) => (a.link < b.link ? -1 : a.link > b.link ? 1 : 0))

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
