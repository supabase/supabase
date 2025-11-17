import { BASE_PATH } from 'lib/constants'
import { Database, Info } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { CardHeader, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

// Schema Flow Node Component
interface SchemaFlowNodeProps {
  nodeRef: React.RefObject<HTMLDivElement>
  icon: React.ReactNode
  iconContainerClassName?: string
  label: string
  description: string
  ariaLabel: string
  labelClassName?: string
  isPending?: boolean
}

const SchemaFlowNode = ({
  nodeRef,
  icon,
  iconContainerClassName = '',
  label,
  description,
  ariaLabel,
  labelClassName = 'text-foreground',
  isPending = false,
}: SchemaFlowNodeProps) => {
  return (
    <div
      ref={nodeRef}
      className="flex items-center gap-x-3 rounded bg-surface-75 border border-default px-4 py-4 z-10 shrink-0"
      role="group"
      aria-label={ariaLabel}
    >
      <div
        className={`w-8 h-8 border rounded-md flex items-center justify-center ${iconContainerClassName}`}
        aria-hidden="true"
      >
        {icon}
      </div>
      <div className="flex flex-col gap-y-1.5">
        <p className={`text-sm leading-none ${labelClassName}`}>{label}</p>
        {isPending ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <p className="text-sm leading-none text-foreground-lighter flex items-center gap-x-1 cursor-help">
                {description}
                <Info size={14} className="text-foreground-lighter" />
              </p>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[36ch] text-center text-balance">
              <p>This schema will be created once a table is published from your Iceberg client</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <p className="text-sm leading-none text-foreground-lighter">{description}</p>
        )}
      </div>
    </div>
  )
}

// Simple Schema Flow Diagram Component
interface SchemaFlowDiagramProps {
  sourceLabel: string
  sourceType: 'analytics' | 'postgres'
  targetLabel: string
  isPending: boolean
}

// Shared constants for SVG styling
const SVG_STROKE_COLOR = 'hsl(var(--foreground-muted))'
const SVG_STROKE_WIDTH = '1.25'
const SVG_CIRCLE_RADIUS = 3
const SVG_DASH_ARRAY = '5, 5'

// Shared CSS styles for animated/static dashed lines
const dashedLineStyles = `
  .schema-flow-animated-dash {
    stroke-dasharray: ${SVG_DASH_ARRAY};
    animation: schema-flow-dash 1s linear infinite;
  }
  .schema-flow-static-dash {
    stroke-dasharray: ${SVG_DASH_ARRAY};
  }
  @keyframes schema-flow-dash {
    to {
      stroke-dashoffset: -10;
    }
  }
`

export const SchemaFlowDiagram = ({
  sourceLabel,
  sourceType,
  targetLabel,
  isPending,
}: SchemaFlowDiagramProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const sourceRef = useRef<HTMLDivElement>(null)
  const targetRef = useRef<HTMLDivElement>(null)

  const [lineStart, setLineStart] = useState<{ x: number; y: number } | null>(null)
  const [verticalLinePosition, setVerticalLinePosition] = useState<{
    x: number
    y: number
    height: number
  } | null>(null)

  useEffect(() => {
    const updatePath = () => {
      if (!containerRef.current || !sourceRef.current || !targetRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const sourceRect = sourceRef.current.getBoundingClientRect()
      const targetRect = targetRef.current.getBoundingClientRect()

      // Horizontal line position (desktop)
      const sourceX = sourceRect.right - containerRect.left
      const sourceY = sourceRect.top + sourceRect.height / 2 - containerRect.top
      setLineStart({ x: sourceX, y: sourceY })

      // Vertical line position (mobile) - calculate actual gap between nodes
      const lineX = 64 // ~3rem from left (48px = 3rem), relative to container
      const sourceBottomY = sourceRect.bottom - containerRect.top
      const targetTopY = targetRect.top - containerRect.top
      const gapHeight = targetTopY - sourceBottomY
      setVerticalLinePosition({ x: lineX, y: sourceBottomY, height: gapHeight })
    }

    // Small delay to ensure layout is ready
    const timeoutId = setTimeout(updatePath, 0)
    window.addEventListener('resize', updatePath)
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', updatePath)
    }
  }, [sourceLabel, targetLabel])

  // Create dotted background pattern
  const dotPattern = `radial-gradient(circle, ${SVG_STROKE_COLOR} 1px, transparent 1px)`

  return (
    <CardHeader
      ref={containerRef}
      className="relative flex flex-col lg:flex-row items-start lg:items-center gap-8 lg:gap-24 border-b px-8 py-8 space-y-0"
      role="img"
      aria-label={`Schema flow diagram showing ${sourceLabel} ${sourceType} schema connecting to ${targetLabel} analytics schema`}
    >
      {/* Shared styles for dashed lines */}
      <style>{dashedLineStyles}</style>
      {/* Dotted Background Pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: dotPattern,
          backgroundSize: '16px 16px',
          backgroundPosition: '0 0',
          opacity: 0.2,
        }}
        aria-hidden="true"
      />
      {/* Source Node */}
      <SchemaFlowNode
        nodeRef={sourceRef}
        icon={
          sourceType === 'analytics' ? (
            <img
              src={`${BASE_PATH}/img/icons/iceberg-icon.svg`}
              alt="Apache Iceberg icon"
              className="w-5 h-5"
            />
          ) : (
            <Database size={16} className="text-white" />
          )
        }
        iconContainerClassName={
          sourceType === 'analytics'
            ? 'bg-blue-300 border-blue-600'
            : 'bg-brand-500 border-brand-600'
        }
        label={sourceLabel}
        description={sourceType === 'analytics' ? 'Iceberg namespace' : 'Database schema'}
        ariaLabel={`Source: ${sourceLabel} ${sourceType} schema`}
      />

      {/* SVG Path for Vertical Dashed Line (Mobile) */}
      {verticalLinePosition && (
        <svg
          className="absolute lg:hidden pointer-events-none"
          style={{
            left: `${verticalLinePosition.x - 0.5}px`,
            top: `${verticalLinePosition.y}px`,
            width: '1px',
            height: `${verticalLinePosition.height}px`,
            overflow: 'visible',
            opacity: isPending ? 0.5 : 1,
          }}
          viewBox={`0 0 1 ${verticalLinePosition.height}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {/* Straight vertical line - uses viewBox coordinates */}
          <path
            d={`M 0.5 0 L 0.5 ${verticalLinePosition.height}`}
            fill="none"
            stroke={SVG_STROKE_COLOR}
            strokeWidth={SVG_STROKE_WIDTH}
            className={isPending ? 'schema-flow-static-dash' : 'schema-flow-animated-dash'}
          />
          {/* Dot at start */}
          <circle cx="0.5" cy="0" r={SVG_CIRCLE_RADIUS} fill={SVG_STROKE_COLOR} />
          {/* Dot at end */}
          <circle
            cx="0.5"
            cy={verticalLinePosition.height}
            r={SVG_CIRCLE_RADIUS}
            fill={SVG_STROKE_COLOR}
          />
        </svg>
      )}

      {/* SVG Path for Horizontal Dashed Line (Desktop) */}
      {lineStart && (
        <svg
          className="absolute hidden lg:block pointer-events-none"
          style={{
            left: `${lineStart.x}px`,
            top: `${lineStart.y - 0.75}px`,
            width: '6rem',
            height: '1px',
            overflow: 'visible',
            opacity: isPending ? 0.35 : 1,
          }}
          aria-hidden="true"
        >
          {/* Straight horizontal line */}
          <path
            d="M 0 0 L 96 0"
            fill="none"
            stroke={SVG_STROKE_COLOR}
            strokeWidth={SVG_STROKE_WIDTH}
            className={isPending ? 'schema-flow-static-dash' : 'schema-flow-animated-dash'}
          />
          {/* Dot at start */}
          <circle cx="0" cy="0" r={SVG_CIRCLE_RADIUS} fill={SVG_STROKE_COLOR} />
          {/* Dot at end */}
          <circle cx="96" cy="0" r={SVG_CIRCLE_RADIUS} fill={SVG_STROKE_COLOR} />
        </svg>
      )}

      {/* Target Node */}
      <SchemaFlowNode
        nodeRef={targetRef}
        icon={<Database size={16} className={isPending ? 'text-foreground-muted' : 'text-white'} />}
        iconContainerClassName={
          isPending ? 'bg-surface-100 border-border' : 'bg-brand-500 border-brand-600'
        }
        label={targetLabel}
        description={`Analytics schema`}
        ariaLabel={`Target: ${targetLabel} schema${isPending ? ' that will be created' : ''}`}
        labelClassName="text-foreground"
        isPending={isPending}
      />
    </CardHeader>
  )
}
