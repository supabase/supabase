import fs from 'fs'
import fetch from 'cross-fetch'

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
  'pages/handbook/contributing.mdx',
  'pages/handbook/introduction.mdx',
  'pages/handbook/supasquad.mdx',
  'pages/[...slug].tsx',
  'pages/reference/api/[...slug].tsx',
  'pages/reference/auth/[...slug].tsx',
  'pages/reference/cli/[...slug].tsx',
  'pages/reference/dart/[...slug].tsx',
  'pages/reference/dart/crawlers/[...slug].tsx',
  'pages/reference/dart/v0/[...slug].tsx',
  'pages/reference/dart/v0/crawlers/[...slug].tsx',
  'pages/reference/javascript/[...slug].tsx',
  'pages/reference/javascript/crawlers/[...slug].tsx',
  'pages/reference/javascript/v1/[...slug].tsx',
  'pages/reference/javascript/v1/crawlers/[...slug].tsx',
  'pages/reference/self-hosting-auth/[...slug].tsx',
  'pages/reference/self-hosting-realtime/[...slug].tsx',
  'pages/reference/self-hosting-storage/[...slug].tsx',
  'pages/reference/storage/[...slug].tsx',
  'pages/.DS_Store',
  'pages/guides/.DS_Store',
  'pages/guides/auth/.DS_Store',
  'pages/guides/auth/auth-helpers/.DS_Store',
  'pages/guides/auth/social-login/.DS_Store',
  'pages/guides/database/.DS_Store',
  'pages/guides/getting-started/.DS_Store',
  'pages/guides/resources/.DS_Store',
  'pages/guides/resources/self-hosting/.DS_Store',
  'pages/guides/resources/supabase-cli/.DS_Store',
  'pages/reference/.DS_Store',
  'pages/reference/javascript/.DS_Store',
  'pages/reference/javascript/v1/.DS_Store',
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

async function getPlainHtmlFromMarkdown(slug) {
  const response = await fetch(`http://localhost:3001/docs/api/seed-search/${slug}`)

  const body = await response.text()
  return body
}

async function generateSearchObjects() {
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
    const guidePagesearchObjects = await Promise.all(
      guidePages.map(async (slug) => {
        //console.log('the slug in guide pages', slug)
        let id, title, description, plainPageContent
        const fileContents = fs.readFileSync(slug, 'utf8')
        const { data } = matter(fileContents)

        // We need to render the mdx content to generate plain html to send to Algolia
        if (slug.includes('.mdx')) {
          plainPageContent = await getPlainHtmlFromMarkdown(slug)
          console.log('plainPageContent', plainPageContent)
        }

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
          pageContent: plainPageContent,
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
        //console.log('object:', object)
        return object
      })
    )
    // Some of the reference generated files come with an 'index' page that we can ignore
    // .filter((object) => !object.url.endsWith('/index'))
    // .filter((object) => !object.url.endsWith('/.gitkeep'))

    const combinedSearchObjects = guidePagesearchObjects.concat(
      clientLibSearchObjects,
      apiObjects,
      cliObjects
    )

    //    console.log(combinedSearchObjects)

    //@ts-ignore
    //await index.clearObjects()
    //console.log(`Successfully cleared records from ${indexName}`)

    //@ts-ignore
    //const algoliaResponse = await index.saveObjects(combinedSearchObjects)

    //@ts-ignore
    //console.log(`Successfully saved ${algoliaResponse.objectIDs.length} records into ${indexName}.`)
  } catch (error) {
    console.log('Error:', error)
  }
}

generateSearchObjects()
