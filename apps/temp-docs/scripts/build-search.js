const fs = require('fs')
const crypto = require('crypto')
const path = require('path')
const matter = require('gray-matter')
const dotenv = require('dotenv')
const algoliasearch = require('algoliasearch/lite')

// [Joshen] Scaffolding index logic to save to Algolia
// Need to think about what object structure to send to algolia
// Experiment is currently only sending MDX files from the docs/guides
// We need to send everything else too

// Also note that we'll need to do a general clean up of the files in the docs
// A lot of them are not even linked to within the docs site, so just need to
// double check if they can be removed or if we want them in the side bars.
const ignoredFiles = [
  'docs/404.mdx',
  'docs/faqs.mdx',
  'docs/going-into-prod.mdx',
  'docs/guides.mdx',
]

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
          .replace('docs', '/docs')
          .replace(/\.mdx$/, '')
        const source = slug.includes('/reference') ? 'reference' : 'guide'
        const object = {
          objectID: crypto.randomUUID(),
          id,
          title,
          description,
          url,
          source,
          content,
          type: 'lvl1',
          hierarchy: {
            lvl0: 'Core Concepts',
            lvl1: title,
          },
        }

        if (slug.includes('/reference')) {
          const slugSegments = slug.split('/')
          const category = slugSegments[slugSegments.indexOf('reference') + 1]
          const version = slugSegments[slugSegments.indexOf('reference') + 2] || ''

          object.category = category.replace(/\.mdx$/, '')
          if (version.length === 2) object.version = version
        } else {
          object.category = undefined
          object.version = undefined
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
