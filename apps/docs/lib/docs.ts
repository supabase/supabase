import fs from 'fs'
import { join } from 'path'
import matter from 'gray-matter'
import nonGeneratedReferencePages from 'data/nonGeneratedReferencePages'
import { REFERENCES } from 'components/Navigation/Navigation.constants'

const docsDirectory = process.cwd()

const getPathToGeneratedDoc = (slug: string) => {
  const sections = slug.split('/')
  const updatedSections = sections.slice()
  updatedSections.splice(updatedSections.length - 1, 0, 'generated')
  return updatedSections.join('/')
}

export function getDocsBySlug(slug: string) {
  const realSlug = slug.replace(/\.mdx$/, '')

  const formattedSlug =
    (realSlug.includes('reference/javascript/') &&
      !nonGeneratedReferencePages.includes(realSlug)) ||
    (realSlug.includes('reference/dart/') && !nonGeneratedReferencePages.includes(realSlug)) ||
    (realSlug.includes('reference/cli/') && !nonGeneratedReferencePages.includes(realSlug)) ||
    (realSlug.includes('reference/api/') && !nonGeneratedReferencePages.includes(realSlug)) ||
    (realSlug.includes('reference/auth/') && !nonGeneratedReferencePages.includes(realSlug)) ||
    (realSlug.includes('reference/realtime/') && !nonGeneratedReferencePages.includes(realSlug)) ||
    (realSlug.includes('reference/storage/') && !nonGeneratedReferencePages.includes(realSlug))
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
    fullPath = join(docsDirectory, 'pages/404.mdx')
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8')

  const { data, content } = matter(fileContents)

  // Append the title as the h1 tag in the content
  const formattedContent = data.title !== undefined ? `# ${data.title} \n\n${content}` : content

  return { slug: realSlug, meta: data, content: formattedContent }
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

// [Joshen] Initially tried to simplify the NavBar versioning by reading the directory
// but caused some issues on Vercel. Just gonna park this for now.
export function getLibraryVersions(slug: string) {
  const paths = slug.split('/')
  if (paths.includes('reference') && paths.length >= 3) {
    const reference = REFERENCES[paths[2]]
    if (reference?.library !== undefined) {
      const path = `data/nav/${reference.library}`
      const list = fs.readdirSync(path).map((file) => file.split('.')[0])
      return list.reverse()
    }
  }
  return []
}
