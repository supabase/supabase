const fs = require('fs')
const crypto = require('crypto')
const path = require('path')
const matter = require('gray-matter')
const dotenv = require('dotenv')
const algoliasearch = require('algoliasearch/lite')

// [Joshen] We initially thought of building out our search using Algolia directly,
// but eventually decided to just use DocSearch since it provides us a UI and some
// configurations out of the box (e.g Doc hierarchy).

// As such when creating the search object, the properties that are specifically read
// by DocSearch are "type" and "hierarchy". The rest, though saved into Algolia (which we
// can potentially use to craft more nuanced search experiences) are not used by DocSearch

// Note that we'll need to do a general clean up of the files in the docs
// A lot of them are not even linked to within the docs site, so just need to
// double check if they can be removed or if we want them in the side bars.
const ignoredFiles = [
  'docs/404.mdx',
  'docs/support.mdx',
  'docs/faqs.mdx',
  'docs/guides.mdx',
  'docs/guides/database/arrays.mdx',
  'docs/guides/database/json.mdx',
]

const nameMap = {
  api: 'Management API',
  cli: 'Supabase CLI',
  auth: 'Auth Server',
  storage: 'Storage Server',
  postgres: 'Postgres',
  dart: 'Supabase Flutter Library',
  javascript: 'Supabase JavaScript Library',
}

async function walk(dir) {
  let files = await fs.promises.readdir(dir)
  files = await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(dir, file)
      const stats = await fs.promises.stat(filePath)
      if (stats.isDirectory()) return walk(filePath)
      else if (stats.isFile()) return filePath
    })
  )

  return files.reduce((all, folderContents) => all.concat(folderContents), [])
}

;(async function () {
  // initialize environment variables
  dotenv.config()

  if (!process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || !process.env.ALGOLIA_SEARCH_ADMIN_KEY) {
    return console.log(
      'Missing Algolia app ID / admin Key: skipping saving of Algolia search index'
    )
  }

  console.log('Preparing docs indexing for Algolia')

  try {
    const indexName = process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME
    const client = algoliasearch(
      process.env.NEXT_PUBLIC_ALGOLIA_APP_ID,
      process.env.ALGOLIA_SEARCH_ADMIN_KEY
    )
    const index = client.initIndex(indexName)

    const slugs = (await walk('docs')).filter((slug) => !ignoredFiles.includes(slug))

    const searchObjects = slugs
      .map((slug) => {
        const fileContents = fs.readFileSync(slug, 'utf8')
        const { data, content } = matter(fileContents)

        const { id, title, description } = data
        const url = (slug.includes('/generated') ? slug.replace('/generated', '') : slug)
          .replace('docs', '')
          .replace(/\.mdx$/, '')
        const source = slug.includes('/reference') ? 'reference' : 'guide'
        const object = {
          // For Algolia
          objectID: crypto.randomUUID(),
          id,
          title,
          description,
          url,
          source,
          pageContent: content,
          category: undefined,
          version: undefined,

          // Docsearch specific
          type: 'lvl1',
          hierarchy: {
            lvl0: 'Guides',
            lvl1: title,
            lvl2: null,
            lvl3: null,
            lvl4: null,
            lvl5: null,
            lvl6: null,
          },
        }

        if (slug.includes('/reference')) {
          const urlSegments = url.split('/')
          const category = urlSegments[urlSegments.indexOf('reference') + 1]
          const version = urlSegments[urlSegments.indexOf('reference') + 2] || ''

          const hasVersion = /v[0-9]+/.test(version)
          if (hasVersion) {
            object.version = version
            object.type = title === nameMap[category] ? 'lvl2' : 'lvl3'
            object.hierarchy.lvl1 = nameMap[category]
            object.hierarchy.lvl2 = version
            object.hierarchy.lvl3 = title
          } else {
            const page = urlSegments[urlSegments.indexOf('reference') + 2]
            if (page === 'generated') {
            } else {
              if (page !== undefined) {
                object.type = 'lvl2'
                object.hierarchy.lvl1 = nameMap[category]
                object.hierarchy.lvl2 = title
              }
            }
          }

          object.category = category ? category.replace(/\.mdx$/, '') : undefined
          object.hierarchy.lvl0 = 'References'
        }

        return object
      })
      // Some of the reference generated files come with an 'index' page that we can ignore
      .filter((object) => !object.url.endsWith('/index'))
      .filter((object) => !object.url.endsWith('/.gitkeep'))

    await index.clearObjects()
    console.log(`Successfully cleared records from ${indexName}`)

    const algoliaResponse = await index.saveObjects(searchObjects)
    console.log(`Successfully saved ${algoliaResponse.objectIDs.length} records into ${indexName}.`)
  } catch (error) {
    console.log('Error:', error)
  }
})()
