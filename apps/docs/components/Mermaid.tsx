import { renderMermaidSVG } from 'beautiful-mermaid'
import { useId } from 'react'

interface MermaidProps {
  chart: string
}

function extractAccessibility(chart: string) {
  const metadata = { title: '', description: '' }
  // Match quoted labels and comments first so their contents remain untouched.
  const source = chart.replace(
    /"(?:\\.|[^"\\])*"|^[\t ]*%%.*$|^[\t ]*acc(Title|Descr)[\t ]*:[\t ]*(.*)$|^[\t ]*accDescr[\t ]*\{([^}]*)(\}|$)/gm,
    (
      match,
      field: string | undefined,
      value: string | undefined,
      block: string | undefined,
      closing: string | undefined
    ) => {
      if (field) {
        metadata[field === 'Title' ? 'title' : 'description'] = value?.trim() ?? ''
      } else if (block !== undefined) {
        if (!closing) throw new Error('Unterminated Mermaid accDescr block')
        metadata.description = block.trim()
      } else {
        return match
      }
      return ''
    }
  )
  return { chart: source, ...metadata }
}

function accessibility(svg: string, title: string, description: string, prefix: string) {
  if (!title && !description) return svg
  const escapeXml = (text: string) =>
    text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  const labelledBy = title ? ` aria-labelledby="${prefix}title"` : ''
  const describedBy = description ? ` aria-describedby="${prefix}description"` : ''
  const titleElement = title ? `<title id="${prefix}title">${escapeXml(title)}</title>` : ''
  const descriptionElement = description
    ? `<desc id="${prefix}description">${escapeXml(description)}</desc>`
    : ''
  return svg.replace(
    /<svg\b[^>]*>/,
    (opening) =>
      `${opening.slice(0, -1)} role="img"${labelledBy}${describedBy}>${titleElement}${descriptionElement}`
  )
}

function scopeIds(svg: string, prefix: string) {
  const ids = new Set([...svg.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]))
  return [...ids].reduce(
    (scoped, id) =>
      scoped
        .replaceAll(`id="${id}"`, `id="${prefix}${id}"`)
        .replaceAll(`url(#${id})`, `url(#${prefix}${id})`)
        .replaceAll(`href="#${id}"`, `href="#${prefix}${id}"`),
    svg
  )
}

export function Mermaid({ chart }: MermaidProps) {
  const prefix = useId()
  const { chart: source, title, description } = extractAccessibility(chart)
  const svg = renderMermaidSVG(source, {
    bg: 'var(--background-default)',
    fg: 'var(--foreground-default)',
    accent: 'hsl(var(--brand-default))',
    muted: 'var(--foreground-light)',
    line: 'var(--border-strong)',
    border: 'var(--border-strong)',
    surface: 'var(--background-surface-200)',
    transparent: true,
  })

  return (
    <div
      className="my-6 overflow-x-auto rounded-md border bg-surface-100 p-4 [&>svg]:mx-auto [&>svg]:h-auto [&>svg]:max-w-full"
      dangerouslySetInnerHTML={{
        __html: accessibility(scopeIds(svg, prefix), title, description, prefix),
      }}
    />
  )
}
