import fs from 'fs'
import crypto from 'crypto'
import path from 'path'
import matter from 'gray-matter'
import dotenv from 'dotenv'
import algoliasearch from 'algoliasearch/lite'
import { isEmpty } from 'lodash'

// search objects
import { generateClientLibSearchObjects } from './files/client-libs'
import { generateAPISearchObjects } from './files/api'
import { generateCLISearchObjects } from './files/cli'

const cliObjects = generateCLISearchObjects()
const apiObjects = generateAPISearchObjects()
const clientLibSearchObjects = generateClientLibSearchObjects()

// @ts-ignore
// The properties of the searchObject that are specifically read
// by DocSearch are "type" and "hierarchy". The rest, though saved into Algolia (which we
// can potentially use to craft more nuanced search experiences) are not used by DocSearch
const ignoredFiles = [
  'pages/404.mdx',
  'pages/faq.mdx',
  'pages/support.mdx',
  'pages/oss.tsx',
  'pages/_app.tsx',
  'pages/_document.tsx',
  'pages/[...slug].tsx',
  'pages/handbook/contributing.mdx',
  'pages/handbook/introduction.mdx',
  'pages/handbook/supasquad.mdx',
]

async function walk(dir) {
  let files = await fs.promises.readdir(dir)
  //@ts-ignore
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

    const guidePages = (await walk('pages')).filter((slug) => !ignoredFiles.includes(slug))

    // generate search objects for mdx guide pages
    const guidePagesearchObjects = guidePages
      .map((slug) => {
        let id, title, description
        const fileContents = fs.readFileSync(slug, 'utf8')
        const { data, content } = matter(fileContents)

        if (isEmpty(data)) {
          // Guide pages do not have front-matter meta, unlike reference pages, have to manually extract
          const metaIndex = fileContents.indexOf('export const meta = {')
          if (metaIndex !== -1) {
            const metaString =
              fileContents
                .slice(metaIndex + 20, fileContents.indexOf('}', metaIndex + 1) + 1)
                .replace(/\n/g, '')
                .slice(0, -2) + '}'
            const meta = eval(`(${metaString})`)
            id = meta.id
            title = meta.title
            description = meta.description
          }
        } else {
          id = data.id
          title = data.title
          description = data.description
        }

        const url = (slug.includes('/generated') ? slug.replace('/generated', '') : slug)
          .replace('docs', '')
          .replace('pages', '')
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
          //pageContent: content,
          pageContent: '',
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

        return object
      })
      // Some of the reference generated files come with an 'index' page that we can ignore
      .filter((object) => !object.url.endsWith('/index'))
      .filter((object) => !object.url.endsWith('/.gitkeep'))

    const combinedSearchObjects = guidePagesearchObjects.concat(
      clientLibSearchObjects,
      apiObjects,
      cliObjects
    )

    //@ts-ignore
    await index.clearObjects()
    console.log(`Successfully cleared records from ${indexName}`)

    //@ts-ignore
    const algoliaResponse = await index.saveObjects(combinedSearchObjects)

    //@ts-ignore
    console.log(`Successfully saved ${algoliaResponse.objectIDs.length} records into ${indexName}.`)
  } catch (error) {
    console.log('Error:', error)
  }
})()
