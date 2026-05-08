import { renderMermaidSVG } from 'beautiful-mermaid'

interface MermaidProps {
  chart: string
}

export function Mermaid({ chart }: MermaidProps) {
  let svg: string
  try {
    svg = renderMermaidSVG(chart, {
      bg: 'hsl(var(--background-default))',
      fg: 'hsl(var(--foreground-default))',
      transparent: true,
    })
  } catch (err) {
    return (
      <pre className="text-warning text-sm">{err instanceof Error ? err.message : String(err)}</pre>
    )
  }

  return (
    <div
      className="my-6 overflow-x-auto rounded-md border bg-surface-100 p-4 [&>svg]:mx-auto [&>svg]:h-auto [&>svg]:max-w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
