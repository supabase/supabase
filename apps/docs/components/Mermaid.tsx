import { renderMermaidSVG } from 'beautiful-mermaid'

interface MermaidProps {
  chart: string
}

export function Mermaid({ chart }: MermaidProps) {
  const svg = renderMermaidSVG(chart, {
    bg: 'hsl(var(--background-default))',
    fg: 'hsl(var(--foreground-default))',
    accent: 'hsl(var(--brand-default))',
    muted: 'hsl(var(--foreground-light))',
    line: 'hsl(var(--border-strong))',
    border: 'hsl(var(--border-strong))',
    surface: 'hsl(var(--background-surface-200))',
    transparent: true,
  })

  return (
    <div
      className="my-6 overflow-x-auto rounded-md border bg-surface-100 p-4 [&>svg]:mx-auto [&>svg]:h-auto [&>svg]:max-w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
