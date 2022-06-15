import fs from 'fs'
import { join } from 'path'
import matter from 'gray-matter'

const docsDirectory = process.cwd()

export function getDocsBySlug(slug: string) {
  const realSlug = slug.replace(/\.mdx$/, '')
  let fullPath = join(docsDirectory, `${realSlug}.mdx`)

  if (!fs.existsSync(fullPath)) {
    console.log(`\nfile ${fullPath} not found, redirect to 404\n`)
    fullPath = join(docsDirectory, 'docs/404.mdx')
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8')

  const { data, content } = matter(fileContents)

  return { slug: realSlug, meta: data, content }
}

export function getAllDocs() {
  const slugs = walk('docs')
  const docs = slugs.map((slug) => getDocsBySlug(slug))

  return docs
}

function walk(dir: string) {
  let results: string[] = []
  const list = fs.readdirSync(dir)
  list.forEach(function (file) {
    file = dir + '/' + file
    let slugs = []

    fs.readdirSync(dir).forEach((file) => {
      let absolute = join(dir, file)
      if (fs.statSync(absolute).isDirectory()) {
        fs.readdirSync(absolute).forEach((subFile) => slugs.push(file.concat('/' + subFile)))
      }
    })
  })
  return results
}
