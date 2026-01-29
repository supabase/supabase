'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { cn } from '../../lib/utils/cn'

// Try to import beautiful-mermaid, fall back to standard mermaid
let beautifulMermaid: typeof import('beautiful-mermaid') | null = null
let standardMermaid: typeof import('mermaid').default | null = null

try {
  beautifulMermaid = require('beautiful-mermaid')
} catch {
  // beautiful-mermaid not available, will use standard mermaid
}

try {
  standardMermaid = require('mermaid').default
} catch {
  // mermaid not available
}

// Supabase brand colors for beautiful-mermaid mono mode
const SUPABASE_COLORS = {
  light: {
    background: '#ffffff',
    foreground: '#1c1c1c',
    primary: '#3ecf8e',
    secondary: '#9333ea',
  },
  dark: {
    background: '#171717',
    foreground: '#ededed',
    primary: '#3ecf8e',
    secondary: '#9333ea',
  },
}

// Legacy theme variables for standard mermaid fallback
const darkThemeVariables = {
  background: 'transparent',
  mainBkg: '#171717',
  primaryTextColor: '#ededed',
  secondaryTextColor: '#a0a0a0',
  tertiaryTextColor: '#ededed',
  textColor: '#ededed',
  primaryColor: '#3ecf8e',
  primaryBorderColor: '#3ecf8e',
  secondaryColor: '#9333ea',
  secondaryBorderColor: '#a855f7',
  tertiaryColor: '#262626',
  tertiaryBorderColor: '#404040',
  lineColor: '#525252',
  border1: '#404040',
  border2: '#525252',
  noteBkgColor: '#1a3a2a',
  noteTextColor: '#ededed',
  noteBorderColor: '#3ecf8e',
  actorBkg: '#171717',
  actorBorder: '#525252',
  actorTextColor: '#ededed',
  actorLineColor: '#525252',
  activationBkgColor: '#9333ea',
  activationBorderColor: '#a855f7',
  signalColor: '#ededed',
  signalTextColor: '#ededed',
  sequenceNumberColor: '#171717',
  nodeBkg: '#262626',
  nodeBorder: '#404040',
  clusterBkg: '#1a1a1a',
  clusterBorder: '#404040',
  defaultLinkColor: '#3ecf8e',
  edgeLabelBackground: '#171717',
  attributeBackgroundColorOdd: '#262626',
  attributeBackgroundColorEven: '#171717',
  rowOdd: '#262626',
  rowEven: '#171717',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  fontSize: '14px',
}

const lightThemeVariables = {
  background: 'transparent',
  mainBkg: '#ffffff',
  primaryTextColor: '#1c1c1c',
  secondaryTextColor: '#6b7280',
  tertiaryTextColor: '#1c1c1c',
  textColor: '#1c1c1c',
  primaryColor: '#3ecf8e',
  primaryBorderColor: '#3ecf8e',
  secondaryColor: '#9333ea',
  secondaryBorderColor: '#a855f7',
  tertiaryColor: '#f5f5f5',
  tertiaryBorderColor: '#e5e5e5',
  lineColor: '#d4d4d4',
  border1: '#e5e5e5',
  border2: '#d4d4d4',
  noteBkgColor: '#ecfdf5',
  noteTextColor: '#1c1c1c',
  noteBorderColor: '#3ecf8e',
  actorBkg: '#ffffff',
  actorBorder: '#d4d4d4',
  actorTextColor: '#1c1c1c',
  actorLineColor: '#d4d4d4',
  activationBkgColor: '#9333ea',
  activationBorderColor: '#a855f7',
  signalColor: '#1c1c1c',
  signalTextColor: '#1c1c1c',
  sequenceNumberColor: '#ffffff',
  nodeBkg: '#f5f5f5',
  nodeBorder: '#e5e5e5',
  clusterBkg: '#fafafa',
  clusterBorder: '#e5e5e5',
  defaultLinkColor: '#3ecf8e',
  edgeLabelBackground: '#ffffff',
  attributeBackgroundColorOdd: '#f5f5f5',
  attributeBackgroundColorEven: '#ffffff',
  rowOdd: '#f5f5f5',
  rowEven: '#ffffff',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  fontSize: '13px',
}

export interface MermaidProps {
  /** Mermaid diagram definition (e.g. flowchart, sequence, erDiagram) */
  chart: string
  /** Additional CSS classes for the container */
  className?: string
  /** Force use of standard mermaid instead of beautiful-mermaid */
  useStandardMermaid?: boolean
}

/**
 * Renders a Mermaid diagram from text using beautiful-mermaid for ultra-fast,
 * themeable rendering with automatic fallback to standard mermaid.
 *
 * beautiful-mermaid benefits:
 * - Ultra-fast rendering (100+ diagrams in <500ms)
 * - Zero DOM dependencies
 * - CSS custom properties for live theme switching
 * - Dual output support (SVG + ASCII)
 *
 * Supports flowcharts, sequence diagrams, ER diagrams, state diagrams, and class diagrams.
 * Automatically adapts to light/dark theme.
 *
 * @example
 * ```tsx
 * <Mermaid chart={`
 *   flowchart LR
 *     A[Start] --> B[End]
 * `} />
 * ```
 *
 * @see https://github.com/lukilabs/beautiful-mermaid
 * @see https://mermaid.js.org/intro/
 */
export function Mermaid({ chart, className, useStandardMermaid = false }: MermaidProps) {
  const [svg, setSvg] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const { resolvedTheme } = useTheme()

  const isDark = resolvedTheme === 'dark'
  const colors = isDark ? SUPABASE_COLORS.dark : SUPABASE_COLORS.light

  useEffect(() => {
    if (!resolvedTheme) return

    const renderChart = async () => {
      try {
        // Prefer beautiful-mermaid if available and not explicitly disabled
        if (beautifulMermaid && !useStandardMermaid) {
          const result = await beautifulMermaid.render(chart.trim(), {
            theme: 'mono',
            colors: {
              background: colors.background,
              foreground: colors.foreground,
              primary: colors.primary,
              secondary: colors.secondary,
            },
            font: {
              family: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              size: 14,
            },
          })
          setSvg(result.svg)
          setError(null)
          return
        }

        // Fallback to standard mermaid
        if (standardMermaid) {
          standardMermaid.initialize({
            startOnLoad: false,
            theme: 'base',
            themeVariables: isDark ? darkThemeVariables : lightThemeVariables,
            sequence: {
              useMaxWidth: false,
              actorMargin: 150,
              messageMargin: 60,
              noteMargin: 20,
            },
            flowchart: {
              useMaxWidth: false,
            },
            er: {
              useMaxWidth: false,
            },
          })

          const id = `mermaid-${Math.random().toString(36).substring(2, 11)}`
          const { svg } = await standardMermaid.render(id, chart.trim())
          setSvg(svg.replace(/<br\s*>/gi, '<br/>'))
          setError(null)
          return
        }

        throw new Error('No Mermaid renderer available')
      } catch (err) {
        console.error('Mermaid rendering error:', err)
        setError(err instanceof Error ? err.message : 'Failed to render diagram')
      }
    }

    renderChart()
  }, [chart, resolvedTheme, useStandardMermaid, colors, isDark])

  if (!resolvedTheme) {
    return <div className={cn('my-6 rounded-lg bg-muted p-6 animate-pulse h-64', className)} />
  }

  if (error) {
    return (
      <div
        className={cn(
          'my-4 p-4 bg-destructive-200 border border-destructive-400 rounded-md',
          className
        )}
      >
        <p className="text-destructive-600 text-sm font-mono">Mermaid Error: {error}</p>
        <pre className="mt-2 text-xs text-foreground-lighter overflow-auto">{chart}</pre>
      </div>
    )
  }

  return (
    <figure
      className={cn(
        'my-6 w-full flex justify-center rounded-lg border p-6',
        'bg-white border-[#e5e5e5] dark:bg-[#171717] dark:border-[#333]',
        '[&_svg]:h-auto [&_svg]:max-w-full',
        className
      )}
      style={{
        // CSS custom properties for beautiful-mermaid live theme switching
        '--mermaid-bg': colors.background,
        '--mermaid-fg': colors.foreground,
        '--mermaid-primary': colors.primary,
        '--mermaid-secondary': colors.secondary,
      } as React.CSSProperties}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
