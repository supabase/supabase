import fs from 'fs'
import { join } from 'path'
import matter from 'gray-matter'

const docsDirectory = process.cwd()

const nonGeneratedReferencePages = [
  'docs/reference/javascript/installing',
  'docs/reference/javascript/release-notes',
  'docs/reference/javascript/upgrade-guide',
  'docs/reference/javascript/typescript-support',
]

const getPathToGeneratedDoc = (slug: string) => {
  const sections = slug.split('/')
  const updatedSections = sections.slice()
  updatedSections.splice(updatedSections.length - 1, 0, 'generated')
  return updatedSections.join('/')
}

export function getDocsBySlug(slug: string) {
  console.log('getDocsBySlug', { slug })
  const realSlug = slug.replace(/\.mdx$/, '')
  const formattedSlug =
    realSlug.includes('/javascript/') && !nonGeneratedReferencePages.includes(realSlug)
      ? getPathToGeneratedDoc(realSlug)
      : realSlug

  // files can either be .md or .mdx
  // we need to check which one exists
  let fullPath
  let fullPathMD = join(docsDirectory, `${formattedSlug}.md`)
  let fullPathMDX = join(docsDirectory, `${formattedSlug}.mdx`)

  if (fs.existsSync(fullPathMD)) {
    fullPath = fullPathMD
  }

  if (fs.existsSync(fullPathMDX)) {
    fullPath = fullPathMDX
  }

  // if no match, 404
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
  console.log('getAllDocs', slugs)
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
