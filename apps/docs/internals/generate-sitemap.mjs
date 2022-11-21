import { writeFileSync } from 'fs'
import { globby } from 'globby'
import prettier from 'prettier'

/*
 * kudos to leerob from vercel
 * https://leerob.io/blog/nextjs-sitemap-robots
 */

async function generate() {
  const prettierConfig = await prettier.resolveConfig('./.prettierrc.js')

  const rawPages = await globby([
    // guides
    'docs/*.mdx',
    '!docs/404.mdx',
    'pages/**/*.mdx',
    // reference
    'docs/reference/*.mdx',
    'docs/reference/javascript/*.mdx',
    'docs/reference/javascript/generated/*.mdx',
    '!docs/reference/javascript/v1.mdx', // ignore this
    'docs/reference/dart/*.mdx',
    'docs/reference/dart/generated/*.mdx',
    '!docs/reference/dart/v0.mdx', // ignore this
    'docs/reference/api/*.mdx',
    'docs/reference/api/generated/*.mdx',
    'docs/reference/cli/*.mdx',
    'docs/reference/cli/generated/*.mdx',
    // misc reference
    'docs/reference/postgres/*.mdx',
    'docs/reference/postgres/generated/*.mdx',
    'docs/reference/realtime/*.mdx',
    'docs/reference/realtime/generated/*.mdx',
    'docs/reference/storage/*.mdx',
    'docs/reference/storage/generated/*.mdx',
    'docs/reference/auth/*.mdx',
    'docs/reference/auth/generated/*.mdx',
  ])

  const pages = rawPages.map((x) => {
    let string = x
    string = string.replace('/generated', '')
    string = string.replace('.mdx', '')
    return string
  })

  // add static OSS page
  pages.unshift('docs/oss')
  // add static homepage
  pages.unshift('docs')

  const sitemap = `
    <?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${pages
          .map((path) => {
            // fix homepage
            path = path.replace('pages/index', '')
            return `
              <url>
                  <loc>${`https://supabase.com/${path.replace('pages/', 'docs/')}`}</loc>
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

  const sitemapFilePath = `public/sitemap.xml`
  console.log(`Total of ${pages.length} pages in sitemap, located at /apps/docs/${sitemapFilePath}`)

  // eslint-disable-next-line no-sync
  writeFileSync(sitemapFilePath, formatted)
}

generate()
