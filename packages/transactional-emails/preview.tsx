import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'

import { templates } from './index'
import { theme } from './theme'

/**
 * Writes every template to `out/` as standalone HTML, plus an index that frames each one in
 * an iframe next to its subject line and trigger. Reviewing subjects together matters as much
 * as reviewing bodies: an inbox shows six subject lines, not six emails.
 *
 * Run with `pnpm --filter transactional-emails preview`.
 */

const OUT_DIR = join(import.meta.dirname, 'out')

const escape = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const indexPage = () => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Compute transactional emails</title>
<style>
  body { margin: 0; padding: 32px; background: ${theme.canvas};
         font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
         color: ${theme.foreground}; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  .lede { font-size: 13px; color: ${theme.foregroundLight}; margin: 0 0 32px; max-width: 70ch;
          line-height: 20px; }
  .email { margin-bottom: 40px; max-width: 760px; }
  .meta { border-left: 2px solid ${theme.border}; padding-left: 12px; margin-bottom: 12px; }
  .subject { font-size: 15px; font-weight: 600; margin: 0 0 4px; }
  .trigger { font-size: 12px; color: ${theme.foregroundLighter}; margin: 0; line-height: 18px; }
  .id { font-family: ui-monospace, monospace; font-size: 11px; color: ${theme.foregroundLighter}; }
  iframe { width: 100%; height: 820px; border: 1px solid ${theme.border}; border-radius: 8px;
           background: ${theme.surface}; display: block; }
</style>
<script>
  // Shrink each frame to its own content so short templates do not sit in a tall box.
  addEventListener('load', () => {
    for (const frame of document.querySelectorAll('iframe')) {
      const body = frame.contentDocument?.body
      if (body) frame.style.height = body.scrollHeight + 24 + 'px'
    }
  })
</script>
</head>
<body>
<h1>Compute transactional emails</h1>
<p class="lede">
  Prototype. Values are illustrative and the pricing they imply is not settled. Each template
  is shown with the subject line it would arrive under, since the subject is what decides
  whether the body is ever read.
</p>
${templates
  .map(
    (template) => `<section class="email">
  <div class="meta">
    <p class="subject">${escape(template.subject)}</p>
    <p class="trigger">${escape(template.trigger)}</p>
    <p class="trigger"><span class="id">${escape(template.id)}</span></p>
  </div>
  <iframe src="./${template.id}.html" title="${escape(template.subject)}"></iframe>
</section>`
  )
  .join('\n')}
</body>
</html>`

const main = async () => {
  await mkdir(OUT_DIR, { recursive: true })

  for (const template of templates) {
    const html = `<!doctype html>\n${renderToStaticMarkup(template.element)}`
    await writeFile(join(OUT_DIR, `${template.id}.html`), html, 'utf8')
  }

  await writeFile(join(OUT_DIR, 'index.html'), indexPage(), 'utf8')

  console.log(`Rendered ${templates.length} templates to ${OUT_DIR}`)
  for (const template of templates) {
    console.log(`  ${template.id.padEnd(26)} ${template.subject}`)
  }
}

void main()
