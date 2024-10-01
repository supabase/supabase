/*
 * kudos to leerob from vercel
 * https://leerob.io/blog/nextjs-sitemap-robots
 */

import fs from 'fs'
import { globby } from 'globby'
import matter from 'gray-matter'
import prettier from 'prettier'

import { generateCLIPages } from './files/cli'
import { generateReferencePages } from './files/reference-lib'

async function generate() {
  const cliPages = generateCLIPages()
  const referencePages = await generateReferencePages()

  const contentFiles = await globby(['content/**/!(_)*.mdx'])
  const contentPages = await Promise.all(
    contentFiles.map(async (filePath) => {
      const fileContents = await fs.promises.readFile(filePath, 'utf8')
      const {
        data: { sitemapPriority },
      } = matter(fileContents)

      return {
        link: filePath.replace(/^content\//, '').replace(/\.mdx$/, ''),
        priority: sitemapPriority,
      }
    })
  )

  const allPages = (contentPages as Array<{ link: string; priority?: number }>).concat(
    referencePages,
    cliPages
  )

  const sitemap = `
    <?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${allPages
          .map(({ link, priority }) => {
            return `
              <url>
                  <loc>${`https://supabase.com/docs/${link}`}</loc>
                  <changefreq>weekly</changefreq>
                  ${priority ? `<priority>${priority}</priority>` : ''}
              </url>
            `
          })
          .join('')}
    </urlset>
    `

  const prettierConfig = await prettier.resolveConfig('./.prettierrc.js')
  const formatted = await prettier.format(sitemap, {
    ...prettierConfig,
    parser: 'html',
  })

  const sitemapFilePath = `public/sitemap.xml`
  console.log(
    `Total of ${allPages.length} pages in sitemap, located at /apps/docs/${sitemapFilePath}`
  )

  // eslint-disable-next-line no-sync
  fs.writeFileSync(sitemapFilePath, formatted)
}

generate()
