import fs from 'node:fs/promises'

import { FULL_FILE, listMarkdownFiles, MARKDOWN_DIR } from './markdown-files'

// Concatenates the content of every file listed in sitemap.md into a single markdown file.
async function generate() {
  const files = await listMarkdownFiles()
  const contents = await Promise.all(
    files.map(async (file) => (await fs.readFile(`${MARKDOWN_DIR}/${file}`, 'utf8')).trim())
  )

  await fs.writeFile(`${MARKDOWN_DIR}/${FULL_FILE}`, `${contents.join('\n\n')}\n`)
  console.log(`Created ${MARKDOWN_DIR}/${FULL_FILE} from ${files.length} files`)
}

generate()
