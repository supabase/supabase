type TocItem = { content: string; slug: string; lvl: number }

function stripFencedCodeBlocks(markdown: string): string {
  const segments = markdown.split('```')
  let acc = ''
  for (let i = 0; i < segments.length; i++) {
    if (i % 2 === 0) acc += segments[i]
  }
  return acc
}

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[`~!@#$%^&*()+=|{}\[\]\\:\";'<>?,./]+/g, '')
    .replace(/\s+/g, '-')
}

export async function generateTocFromMarkdown(markdown: string, maxDepth: number) {
  const noCode = stripFencedCodeBlocks(markdown)
  const lines = noCode.split(/\r?\n/)
  const items: TocItem[] = []

  for (const line of lines) {
    const m = /^(#{1,6})\s+(.*)$/.exec(line)
    if (!m) continue
    const depth = m[1].length
    if (depth > maxDepth) continue
    const text = m[2].trim()
    if (!text) continue
    items.push({ content: text, slug: slugify(text), lvl: depth })
  }

  const content = items
    .map((h) => `${'  '.repeat(Math.max(0, h.lvl - 1))}- [${h.content}](#${h.slug})`)
    .join('\n')

  return { content, json: items }
}
