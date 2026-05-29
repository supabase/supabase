function transformOutsideCodeFences(source: string, transform: (chunk: string) => string): string {
  const fenceRe = /(^(?:`{3,}|~{3,})[^\n]*\n[\s\S]*?\n(?:`{3,}|~{3,})[ \t]*$)/gm
  const parts = source.split(fenceRe)
  return parts.map((part, i) => (i % 2 === 0 ? transform(part) : part)).join('')
}

export function addSelfClosingTags(htmlString: string): string {
  if (!htmlString || typeof htmlString !== 'string') {
    return ''
  }
  return transformOutsideCodeFences(htmlString, (chunk) =>
    chunk.replace(/<img[^>]*>|<br[^>]*>|<hr[^>]*>/g, (match) =>
      match.endsWith('/>') ? match : match.slice(0, -1) + ' />'
    )
  )
}
