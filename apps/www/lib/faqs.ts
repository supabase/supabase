import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

export type FaqSummary = {
  slug: string
  title: string
  description: string
}

const FAQ_DIR = path.join(process.cwd(), '_faqs')

// Every FAQ page in _faqs/, sorted by title.
export function getAllFaqs(): FaqSummary[] {
  return fs
    .readdirSync(FAQ_DIR)
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => {
      const { data } = matter(fs.readFileSync(path.join(FAQ_DIR, file), 'utf8'))
      return {
        slug: file.replace(/\.mdx$/, ''),
        title: String(data.title),
        description: String(data.description),
      }
    })
    .sort((a, b) => a.title.localeCompare(b.title))
}
