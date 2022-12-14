const fs = require('fs')
const crypto = require('crypto')
const path = require('path')
const matter = require('gray-matter')
const dotenv = require('dotenv')
const algoliasearch = require('algoliasearch/lite')
const { isEmpty } = require('lodash')
const yaml = require('js-yaml')
const commonLibSections = require('../../../spec/common-client-libs-sections.json')

function flattenSections(sections) {
  var a = []
  for (var i = 0; i < sections.length; i++) {
    if (sections[i].id) {
      // only push a section that has an id
      // these are reserved for sidebar subtitles
      a.push(sections[i])
    }
    if (sections[i].items) {
      // if there are subitems, loop through
      a = a.concat(flattenSections(sections[i].items))
    }
  }
  return a
}

const clientLibFiles = [
  { fileName: 'supabase_js_v2', label: 'javascript', version: 'v2', versionSlug: false },
  { fileName: 'supabase_js_v1', label: 'javascript', version: 'v1', versionSlug: true },
  { fileName: 'supabase_dart_v1', label: 'dart', version: 'v1', versionSlug: false },
  { fileName: 'supabase_dart_v0', label: 'dart', version: 'v0', versionSlug: true },
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

const flatCommonLibSections = flattenSections(commonLibSections)

// loop through each spec file, find the correspending entry in the common file and grab the title / description / slug
let clientLibSearchObjects = []

clientLibFiles.map((file) => {
  const specs = yaml.load(fs.readFileSync(`../../spec/${file.fileName}.yml`, 'utf8'))

  //take each function id, find it in the commonLibSections file and return { id, title, slug, description, }
  specs.functions.map((fn) => {
    const item = flatCommonLibSections.find((section) => section.id === fn.id)
    if (item) {
      const object = clientLibSearchObjects.push({
        objectID: crypto.randomUUID(),
        id: item.id,
        title: item.title,
        description: item.title,
        url: `/reference/${file.label}/${file.versionSlug ? file.version + '/' : ''}${item.slug}`,
        source: 'reference',
        pageContent: '',
        category: item.product,
        version: file.version,
        type: 'lvl2',
        hierarchy: {
          lvl0: 'References',
          lvl1: `${nameMap[file.label]} ${file.version}`,
          lvl2: item.title,
          lvl3: file.version,
          lvl4: null,
          lvl5: null,
          lvl6: null,
        },
      })
      return object
    }
  })
})

clientLibSearchObjects.map((item) => console.log(item))
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

    // generate search objects for guide pages
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

    //console.log('guidePagesearchObjects:', guidePagesearchObjects)

    const combinedSearchObjects = guidePagesearchObjects.concat(clientLibSearchObjects)

    await index.clearObjects()
    console.log(`Successfully cleared records from ${indexName}`)

    const algoliaResponse = await index.saveObjects(combinedSearchObjects)

    console.log(`Successfully saved ${algoliaResponse.objectIDs.length} records into ${indexName}.`)
  } catch (error) {
    console.log('Error:', error)
  }
})()
