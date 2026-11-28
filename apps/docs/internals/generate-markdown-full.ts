import fs from 'node:fs/promises'

import { FULL_FILE, listMarkdownFiles, MARKDOWN_DIR } from './markdown-files'

// Concatenates the content of every file listed in sitemap.md into a single markdown file.
async function generate() {
  const files = await listMarkdownFiles()
  const contents = await Promise.all(
    files.map(async (file) => (await fs.readFile(`${MARKDOWN_DIR}/${file}`, 'utf8')).trim())
  )

  const fullContent = [
      '# Supabase Documentation',
      '',
      '> Supabase is a Postgres development platform. Each index below lists every page in one area of the docs: a guide section, an SDK, the CLI, or the Management API.',
      '',
      'For product overviews and pricing, see the site-wide index at https://supabase.com/llms.txt.',
      '',
      contents.join('\n\n')
    ]
    .join('\n')

  await fs.writeFile(`${MARKDOWN_DIR}/${FULL_FILE}`, fullContent)
  console.log(`Created ${MARKDOWN_DIR}/${FULL_FILE} from ${files.length} files`)
}

generate()
