'use client'

import 'react-medium-image-zoom/dist/styles.css'

import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'
import { useTheme } from 'next-themes'
import { useBreakpoint } from 'common'
import Zoom from 'react-medium-image-zoom'
import ZoomContent from '../Image/ZoomContent'
import { cn } from '../../lib/utils/cn'

// @mildtomato - 28/12/2025
// for now the colors are hardcoded because the theme variables are not working
// ideally we would use the css theme variables
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

// @mildtomato - 28/12/2025
// for now the colors are hardcoded because the theme variables are not working
// ideally we would use the css theme variables
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
  chart: string
  className?: string
  zoomable?: boolean
}

export function Mermaid({ chart, className, zoomable = true }: MermaidProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [svg, setSvg] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const isLessThanLgBreakpoint = useBreakpoint()

  const isDark = resolvedTheme === 'dark'

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // Re-initialize mermaid with current theme
    mermaid.initialize({
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
        curve: 'linear',
      },
      er: {
        useMaxWidth: false,
      },
    })

    const renderChart = async () => {
      try {
        const id = `mermaid-${Math.random().toString(36).substring(2, 11)}`
        const { svg } = await mermaid.render(id, chart.trim())

        // Post-process SVG
        // Fix <br> tags to be self-closing for XML compatibility
        const fixedSvg = svg.replace(/<br\s*>/gi, '<br/>')
        const parser = new DOMParser()
        const doc = parser.parseFromString(fixedSvg, 'image/svg+xml')
        const svgEl = doc.querySelector('svg')

        // Add diagonal line pattern definition
        let defs = svgEl?.querySelector('defs')
        if (!defs) {
          defs = doc.createElementNS('http://www.w3.org/2000/svg', 'defs')
          svgEl?.insertBefore(defs, svgEl.firstChild)
        }

        const pattern = doc.createElementNS('http://www.w3.org/2000/svg', 'pattern')
        pattern.setAttribute('id', 'diagonalLines')
        pattern.setAttribute('patternUnits', 'userSpaceOnUse')
        pattern.setAttribute('width', '8')
        pattern.setAttribute('height', '8')
        pattern.setAttribute('patternTransform', 'rotate(45)')

        const patternBg = doc.createElementNS('http://www.w3.org/2000/svg', 'rect')
        patternBg.setAttribute('width', '8')
        patternBg.setAttribute('height', '8')
        patternBg.setAttribute('fill', isDark ? '#171717' : '#ffffff')
        pattern.appendChild(patternBg)

        const line = doc.createElementNS('http://www.w3.org/2000/svg', 'line')
        line.setAttribute('x1', '0')
        line.setAttribute('y1', '0')
        line.setAttribute('x2', '0')
        line.setAttribute('y2', '8')
        line.setAttribute('stroke', isDark ? '#3a3a3a' : '#c0c0c0')
        line.setAttribute('stroke-width', '3')
        pattern.appendChild(line)

        defs.appendChild(pattern)

        // Remove roundedness from all rects (we'll add it back for pills)
        const allRects = doc.querySelectorAll('rect')
        allRects.forEach((rect) => {
          rect.setAttribute('rx', '0')
          rect.setAttribute('ry', '0')
        })

        // Style actor boxes (rect.actor-top and rect.actor-bottom) with diagonal lines
        const actorRects = doc.querySelectorAll('rect.actor-top, rect.actor-bottom')
        actorRects.forEach((rect) => {
          // Check if this is a Postgres box by finding sibling text
          const parent = rect.parentElement
          const text = parent?.querySelector('text')
          const isPostgres = text?.textContent?.toLowerCase().includes('postgres')

          rect.setAttribute('fill', 'url(#diagonalLines)')
          rect.setAttribute('stroke', isPostgres ? '#336791' : isDark ? '#525252' : '#d4d4d4')
        })

        const serializer = new XMLSerializer()
        const processedSvg = serializer.serializeToString(doc)
        setSvg(processedSvg)
        setError(null)
      } catch (err) {
        console.error('Mermaid rendering error:', err)
        setError(err instanceof Error ? err.message : 'Failed to render diagram')
      }
    }

    renderChart()
  }, [chart, isDark, mounted])

  if (!mounted) {
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

  const containerClassName = cn(
    'my-6 flex justify-center rounded-lg border p-6 pb-8',
    isDark ? 'bg-[#171717] border-[#333]' : 'bg-white border-[#e5e5e5]',
    className
  )

  if (zoomable) {
    // react-medium-image-zoom requires <img>. To zoom the container WITH the diagram,
    // we bake the container (background + border) into the SVG itself.
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = svg
    const svgEl = tempDiv.querySelector('svg')
    const svgWidth = parseInt(svgEl?.getAttribute('width') || '400')
    const svgHeight = parseInt(svgEl?.getAttribute('height') || '300')

    const padding = 24
    const totalWidth = svgWidth + padding * 2
    const totalHeight = svgHeight + padding * 2
    const bgColor = isDark ? '#171717' : '#ffffff'
    const borderColor = isDark ? '#333333' : '#e5e5e5'

    // SVG with background rect (including border stroke) and mermaid diagram inside
    const wrappedSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}">
      <rect x="0.5" y="0.5" width="${totalWidth - 1}" height="${totalHeight - 1}" rx="8" fill="${bgColor}" stroke="${borderColor}" stroke-width="1"/>
      <g transform="translate(${padding}, ${padding})">${svg}</g>
    </svg>`

    const dataUrl = `data:image/svg+xml,${encodeURIComponent(wrappedSvg)}`

    return (
      <div className="my-6">
        <Zoom ZoomContent={ZoomContent} zoomMargin={isLessThanLgBreakpoint ? 80 : 200}>
          <img
            src={dataUrl}
            alt="Mermaid diagram"
            className="w-full h-auto max-h-[600px] object-contain cursor-zoom-in"
          />
        </Zoom>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn(containerClassName, '[&_svg]:h-auto [&_svg]:max-w-full')}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
