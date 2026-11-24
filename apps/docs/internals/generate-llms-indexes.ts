import fs from 'node:fs'
import path from 'node:path'

import { REFERENCES } from '../content/navigation.references'
import { buildDocsLlmsTxt, buildLlmsIndexes } from './files/llms-indexes'
import { getSitemapPages } from './files/sitemap-pages'

const ROOT_FILE = 'public/llms.txt'
const INDEX_DIR = 'public/llms'

async function generate() {
  const pages = await getSitemapPages()
  const areaTitles = {
    ...Object.fromEntries(
      Object.values(REFERENCES).map((reference) => [
        `reference/${reference.libPath}`,
        reference.name,
      ])
    ),
    // REFERENCES names it "API", which reads like the Data REST API.
    'reference/api': 'Management API',
  }
  const indexes = buildLlmsIndexes(pages, areaTitles)

  fs.rmSync(INDEX_DIR, { recursive: true, force: true })
  for (const index of indexes) {
    const filePath = path.join(INDEX_DIR, `${index.path}.txt`)
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, index.content)
  }
  fs.writeFileSync(ROOT_FILE, buildDocsLlmsTxt(indexes))

  console.log(
    `Wrote ${ROOT_FILE} and ${indexes.length} indexes covering ${pages.length} pages to ${INDEX_DIR}`
  )
}

generate()
