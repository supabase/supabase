const fs = require('fs')
const path = require('path')
const matter = require('gray-matter')
const dotenv = require('dotenv')
const algoliasearch = require('algoliasearch/lite')

// [Joshen] Scaffolding index logic to save to Algolia
// Need to think about what object structure to send to algolia
// Experiment is currently only sending MDX files from the docs/guides
// We need to send everything else too

async function getAllDocs() {
  // write your code to fetch your data
}

async function getAllReferences() {
  // write your code to fetch your data
}

function walk(dir) {
  let results = []
  const list = fs.readdirSync(dir).filter((x) => x.includes('.mdx'))

  // list.forEach(function (file) {
  //   file = dir + '/' + file
  //   let slugs = []

  //   fs.readdirSync(dir).forEach((file) => {
  //     let absolute = path.join(dir, file)
  //     if (fs.statSync(absolute).isDirectory()) {
  //       fs.readdirSync(absolute).forEach((subFile) => slugs.push(file.concat('/' + subFile)))
  //     }
  //   })
  // })
  return list
}

;(async function () {
  // initialize environment variables
  dotenv.config()
  console.log("Schnitzel! Let's fetch some data!")

  try {
    const client = algoliasearch(
      process.env.NEXT_PUBLIC_ALGOLIA_APP_ID,
      process.env.ALGOLIA_SEARCH_ADMIN_KEY
    )
    const index = client.initIndex('dev_docs')

    const slugs = walk('docs/guides')

    const searchObjects = slugs.map((slug) => {
      const fullPath = `docs/guides/${slug}`
      const fileContents = fs.readFileSync(fullPath, 'utf8')
      const { data, content } = matter(fileContents)

      const { id, title, description } = data
      return { objectID: id, title, description }
    })

    const algoliaResponse = await index.saveObjects(searchObjects)
    console.log('Response', algoliaResponse)
  } catch (error) {
    console.log('Error:', error)
  }
})()
