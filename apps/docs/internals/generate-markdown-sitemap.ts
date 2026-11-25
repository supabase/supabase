import fs from 'node:fs/promises'

import { getInternalLinkBaseUrl, withDocsBasePath } from './internal-links'
import { listMarkdownFiles, MARKDOWN_DIR, SITEMAP_FILE } from './markdown-files'

// Lists every generated markdown file (guides, references) as a link to its `.md` URL.
// Pages without a markdown export are simply absent, nothing is patched here.
async function generate() {
  const baseUrl = getInternalLinkBaseUrl()
  const files = await listMarkdownFiles()

  const links = await Promise.all(
    files.map(async (file) => {
      const content = await fs.readFile(`${MARKDOWN_DIR}/${file}`, 'utf8')
      const title = content.match(/^# (.+)$/m)?.[1] ?? file.slice(0, -'.md'.length)
      // Only guides are routed (and negotiated) at `<page>.md`; the rest are served as static files.
      const route = file.startsWith('guides/') ? `/${file}` : `/markdown/${file}`
      return `- [${title}](${baseUrl}${withDocsBasePath(route)})`
    })
  )

  const sitemap = `# Supabase Documentation\n\n${links.join('\n')}\n`
  await fs.writeFile(`${MARKDOWN_DIR}/${SITEMAP_FILE}`, sitemap)
  console.log(`Created ${MARKDOWN_DIR}/${SITEMAP_FILE} with ${links.length} links`)
}

generate()
