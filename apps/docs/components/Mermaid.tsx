import { renderMermaidSVG } from 'beautiful-mermaid'
import { useId } from 'react'

interface MermaidProps {
  chart: string
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
  const svg = renderMermaidSVG(chart, {
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
      dangerouslySetInnerHTML={{ __html: scopeIds(svg, prefix) }}
    />
  )
}
