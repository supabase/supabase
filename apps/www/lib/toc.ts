interface TocEntry {
  depth: number
  text: string
  id: string
}

export function generateToc(
  content: string,
  maxDepth: number = 2
): {
  content: string
  json: TocEntry[]
} {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm
  const toc: TocEntry[] = []
  let match

  while ((match = headingRegex.exec(content)) !== null) {
    const depth = match[1].length
    if (depth <= maxDepth) {
      const text = match[2].trim()
      // Generate GitHub-style ID (lowercase, replace spaces with hyphens)
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
      toc.push({ depth, text, id })
    }
  }

  // Convert TOC entries to markdown
  const tocMarkdown = toc
    .map((entry) => {
      const indent = '  '.repeat(entry.depth - 1)
      return `${indent}- [${entry.text}](#${entry.id})`
    })
    .join('\n')

  return {
    content: tocMarkdown,
    json: toc,
  }
}
