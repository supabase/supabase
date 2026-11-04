/**
 * Crawls every CLI reference page on a running docs server and reports broken
 * internal links and anchors, empty sections, leftover Markdown and missing
 * Markdown twins. Usage: tsx scripts/check-cli-reference.ts [origin]
 */
import { getCliStaticParams } from '~/features/docs/Reference.cli'

const ORIGIN = process.argv[2] ?? 'http://localhost:3001'
const BASE = '/docs'
const CONCURRENCY = 4

const issues = new Map<string, string[]>()
const report = (kind: string, detail: string) =>
  issues.set(kind, [...(issues.get(kind) ?? []), detail])

const pages = new Map<string, Promise<{ status: number; html: string; ids: Set<string> }>>()

function fetchPage(path: string) {
  if (!pages.has(path)) {
    pages.set(
      path,
      fetch(`${ORIGIN}${path}`, { redirect: 'manual' }).then(async (res) => {
        const html = res.status === 200 ? await res.text() : ''
        const visible = html.replace(/<script[\s\S]*?<\/script>/g, '')
        const ids = new Set([...visible.matchAll(/ id="([^"]+)"/g)].map((m) => decode(m[1])))
        return { status: res.status, html: visible, ids }
      })
    )
  }
  return pages.get(path)!
}

const decode = (text: string) =>
  text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')

async function checkPage(path: string) {
  const { status, html, ids } = await fetchPage(path)
  if (status !== 200) return report('page not 200', `${path} (${status})`)

  const article = html.split('id="sb-docs-guide-main-article"')[1]?.split('</article>')[0] ?? ''
  if (!article) return report('no article', path)

  const nav = html.match(/data-cli-nav[\s\S]*?<\/nav>/)?.[0] ?? ''
  const hrefs = [...`${article}${nav}`.matchAll(/href="([^"]+)"/g)].map((m) => decode(m[1]))
  for (const href of new Set(hrefs)) {
    if (/^(https?:|mailto:)/.test(href)) continue
    const [target, anchor] = href.split('#')
    if (!target) {
      if (anchor && !ids.has(anchor)) report('missing anchor', `${path} -> #${anchor}`)
      continue
    }
    if (!target.startsWith(`${BASE}/`)) {
      report('relative link', `${path} -> ${href}`)
      continue
    }
    const linked = await fetchPage(target)
    if (linked.status === 308 || linked.status === 301 || linked.status === 307) {
      report('redirected link', `${path} -> ${href}`)
    } else if (linked.status !== 200) {
      report('broken link', `${path} -> ${href} (${linked.status})`)
    } else if (anchor && !linked.ids.has(anchor)) {
      report('missing anchor', `${path} -> ${href}`)
    }
  }

  const text = article
    .replace(/<pre[\s\S]*?<\/pre>/g, '')
    .replace(/<code[\s\S]*?<\/code>/g, '')
    .replace(/<[^>]+>/g, ' ')
  if (/```|\*\*\w|\]\(/.test(text)) report('leftover markdown', path)
  if (/&amp;(lt|gt|amp|quot);/.test(article)) report('double escaped', path)
  if (/\bundefined\b|\[object Object\]/.test(text)) report('undefined text', path)
  if (/<pre class="cli-output[^"]*">\s*<\/pre>/.test(article)) report('empty output box', path)

  // An h2 with nothing but headings before the next h2
  for (const section of article.split(/(?=<h2[ >])/).slice(1)) {
    const body = section
      .replace(/<h[23][\s\S]*?<\/h[23]>/g, '')
      .replace(/<[^>]+>/g, '')
      .trim()
    if (!body) report('empty section', `${path}: ${section.match(/id="([^"]+)"/)?.[1]}`)
  }

  const lede = article.match(/<p class="cli-lede">([^<]*)<\/p>/)?.[1]?.trim() ?? ''
  if (!lede || lede === '.') report('empty summary', path)

  const md = await fetch(`${ORIGIN}${path}.md`)
  const mdText = md.ok ? await md.text() : ''
  if (
    !md.ok ||
    !md.headers.get('content-type')?.includes('text/markdown') ||
    !mdText.startsWith('# ')
  ) {
    report('markdown twin', `${path}.md (${md.status})`)
  }
  if (!/<link rel="alternate" type="text\/markdown"/.test(html))
    report('no markdown alternate', path)
}

async function main() {
  const paths = (await getCliStaticParams()).map(
    ({ slug }) => `${BASE}/reference/${slug.join('/')}`
  )
  let next = 0
  let done = 0
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < paths.length) {
        const path = paths[next++]
        await checkPage(path)
        if (++done % 25 === 0) console.error(`${done}/${paths.length}`)
      }
    })
  )

  for (const [kind, list] of issues) {
    console.log(
      `\n## ${kind} (${list.length})\n${list.slice(0, 15).join('\n')}${list.length > 15 ? '\n…' : ''}`
    )
  }
  console.log(
    `\nChecked ${paths.length} pages, ${pages.size} distinct URLs fetched, ${[...issues.values()].flat().length} issues`
  )
  if (issues.size > 0) process.exitCode = 1
}

main()
