import { useId, useRef, useState, type MouseEvent, type PointerEvent } from 'react'
import { useClickAway } from 'react-use'
import { cn } from 'ui'
import { GlyphLines } from 'ui-patterns/GlyphLines'

import {
  COLUMNS,
  fromHandleView,
  INITIAL_SHAPES,
  LETTER_PATHS,
  offsetPoint,
  ROWS,
  SLANT,
  SLANT_ORIGINS,
  SYMBOL_HEIGHT,
  SYMBOL_OUTLINE,
  SYMBOL_WIDTH,
  toHandleView,
  toPathData,
  WORDMARK_COLUMNS,
  WORDMARK_ROWS,
  WORDMARK_WIDTH,
  type PathNode,
  type Point,
} from './logo-geometry'

export interface VectorLogoProps {
  guideText: string
  className?: string
}

type DragTarget = (typeof DRAG_TARGETS)[number]

interface NodeRef {
  shape: number
  subpath: number
  node: number
}

// gradientId names the overlay gradient, and the drop shadow filter is `${gradientId}-shadow`
interface RaisedPathsProps {
  paths: { key: string; d: string }[]
  gradientId: string
}

interface Drag {
  ref: NodeRef
  target: DragTarget
  start: Point
  node: PathNode
}

// px per symbol unit. the viewBox draws 1:1, so a 1 unit stroke stays 1px at any scale
const SCALE = 1.1
const PADDING = 24
// a guide runs this far from the symbol. it must pass every edge of the hero
const REACH = 2400
const HATCH_SPACING = 6
// a hovered guide spells this in place of the team names, and links to careers
const CAREERS_GUIDE_TEXT = 'YOU + '
const MORPH_TRANSITION = 'transition-all duration-500 ease-out motion-reduce:transition-none'

const DRAG_TARGETS = ['point', 'in', 'out'] as const

const getAnchorSize = (shapeIndex: number) => (shapeIndex === 0 ? 7 : 5)

// lines draw in order, and undraw in reverse after the fill fades out
const getDrawDelay = ({
  index,
  count,
  isDrawn,
}: {
  index: number
  count: number
  isDrawn: boolean
}) => (isDrawn ? index * 60 : 300 + (count - 1 - index) * 60)

export const VectorLogo = ({ guideText, className }: VectorLogoProps) => {
  const [mode, setMode] = useState<'icon' | 'wordmark'>('icon')
  const [shapes, setShapes] = useState(INITIAL_SHAPES)
  const [selected, setSelected] = useState<NodeRef | null>(null)
  const [hoveredGuide, setHoveredGuide] = useState<string | null>(null)
  const dragRef = useRef<Drag | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  // the guide lines have no stroke. GlyphLines draws them, and marks the svg ready so the draw-in waits for hydration
  const guidesRef = useRef<SVGSVGElement>(null)
  const gradientId = useId()
  const hatchId = useId()
  const isWordmark = mode === 'wordmark'
  const subjectWidth = isWordmark ? WORDMARK_WIDTH : SYMBOL_WIDTH
  const width = WORDMARK_WIDTH * SCALE + PADDING * 2
  const height = SYMBOL_HEIGHT * SCALE + PADDING * 2
  const toView = (value: number) => value * SCALE + PADDING
  const shiftStyle = {
    transform: `translateX(${((WORDMARK_WIDTH - subjectWidth) / 2) * SCALE}px)`,
  }
  const contentTransform = `translate(${PADDING} ${PADDING}) scale(${SCALE})`
  const [symbolShape, ...letterShapes] = shapes
  const symbolPath = toPathData(symbolShape)
  const letterPaths = letterShapes.map(toPathData)
  const isShapeShown = (shapeIndex: number) => shapeIndex === 0 || isWordmark
  const selectedNode =
    selected && isShapeShown(selected.shape)
      ? shapes[selected.shape][selected.subpath][selected.node]
      : null
  const handleViews = selectedNode
    ? (['in', 'out'] as const).flatMap((target) => {
        const handle = selectedNode[target]
        return handle
          ? [{ target, view: toHandleView({ anchor: selectedNode.point, handle, scale: SCALE }) }]
          : []
      })
    : []
  const slantLength = Math.hypot(SLANT.dx, SLANT.dy)
  const guides = [
    ...ROWS.map((y) => [-REACH, toView(y), REACH, toView(y)]),
    ...COLUMNS.map((x) => [toView(x), -REACH, toView(x), REACH]),
    ...SLANT_ORIGINS.map(([x, y]) => {
      const dx = (SLANT.dx / slantLength) * REACH
      const dy = (SLANT.dy / slantLength) * REACH
      return [toView(x) - dx, toView(y) - dy, toView(x) + dx, toView(y) + dy]
    }),
  ]

  const wordmarkGuides = [
    ...WORDMARK_ROWS.map((y) => [-REACH, toView(y), REACH, toView(y)]),
    ...WORDMARK_COLUMNS.map((x) => [toView(x), -REACH, toView(x), REACH]),
  ]

  const svgProps = {
    width,
    height,
    viewBox: `0 0 ${width} ${height}`,
    fill: 'none',
  }

  const handleCanvasPointerDown = () => setSelected(null)

  const handleLogoClick = () => setMode(isWordmark ? 'icon' : 'wordmark')

  useClickAway(canvasRef, () => setSelected(null))

  const handleGuidePointerOver = (event: PointerEvent<Element>) => {
    if (event.target instanceof SVGLineElement) setHoveredGuide(event.target.dataset.guide ?? null)
  }

  const handleGuidePointerOut = () => setHoveredGuide(null)

  // every point carries its place in data attributes, so one handler serves all of them
  const handlePointPointerDown = (event: PointerEvent<SVGElement>) => {
    if (event.button !== 0) return
    event.stopPropagation()
    const { dataset } = event.currentTarget
    const ref = {
      shape: Number(dataset.shape),
      subpath: Number(dataset.subpath),
      node: Number(dataset.node),
    }
    const target = DRAG_TARGETS.find((value) => value === dataset.target) ?? 'point'
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      ref,
      target,
      start: [event.clientX, event.clientY],
      node: shapes[ref.shape][ref.subpath][ref.node],
    }
    if (target === 'point') setSelected(ref)
  }

  const handlePointPointerMove = (event: PointerEvent<SVGElement>) => {
    const drag = dragRef.current
    if (!drag) return
    const { node, target } = drag
    const dx = (event.clientX - drag.start[0]) / SCALE
    const dy = (event.clientY - drag.start[1]) / SCALE
    const handle = target === 'point' ? undefined : node[target]
    const moved = handle
      ? {
          ...node,
          [target]: fromHandleView({
            anchor: node.point,
            view:
              offsetPoint({
                point: toHandleView({ anchor: node.point, handle, scale: SCALE }),
                dx,
                dy,
              }) ?? handle,
            scale: SCALE,
          }),
        }
      : {
          id: node.id,
          point: [node.point[0] + dx, node.point[1] + dy] satisfies Point,
          in: offsetPoint({ point: node.in, dx, dy }),
          out: offsetPoint({ point: node.out, dx, dy }),
        }
    setShapes((current) => {
      const next = structuredClone(current)
      next[drag.ref.shape][drag.ref.subpath][drag.ref.node] = moved
      return next
    })
  }

  // capture also ends on pointerup, and on a cancelled touch that sends no pointerup
  const handlePointDragEnd = () => {
    dragRef.current = null
  }

  const handlePointDoubleClick = (event: MouseEvent<SVGElement>) => {
    const { dataset } = event.currentTarget
    const shape = Number(dataset.shape)
    const subpath = Number(dataset.subpath)
    const node = Number(dataset.node)
    setShapes((current) => {
      const next = structuredClone(current)
      next[shape][subpath][node] = INITIAL_SHAPES[shape][subpath][node]
      return next
    })
  }

  return (
    <div className={cn('relative flex w-full flex-col items-center gap-6 pt-16', className)}>
      <GlyphLines
        linesRef={guidesRef}
        text={guideText}
        className={cn(
          'construction-mask absolute top-0 left-1/2 h-full w-screen -translate-x-1/2',
          'font-mono text-border-strong dark:text-border [--glyph-lines-pulse:var(--color-border-stronger)]'
        )}
      />
      <div
        aria-hidden
        className={cn(
          'construction-mask pointer-events-none absolute inset-y-0 left-1/2 flex w-screen -translate-x-1/2 justify-center pt-16',
          // the mask already hides the guides past this box. the clip also stops them taking clicks there
          'overflow-clip'
        )}
      >
        <svg {...svgProps} ref={guidesRef} className="group/guides overflow-visible">
          <defs>
            <pattern
              id={hatchId}
              width={HATCH_SPACING}
              height={HATCH_SPACING}
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <line x1={0} y1={0} x2={0} y2={HATCH_SPACING} className="stroke-border" />
            </pattern>
            <clipPath id={`${hatchId}-reveal`}>
              <rect
                x={toView(SYMBOL_WIDTH / 2) - REACH}
                y={toView(SYMBOL_HEIGHT / 2) - REACH}
                width={REACH * 2}
                height={REACH * 2}
                className={cn(
                  'origin-center transform-fill motion-safe:scale-0',
                  'motion-safe:group-data-glyph-lines-ready/guides:animate-reveal-hatch'
                )}
              />
            </clipPath>
          </defs>
          <g style={shiftStyle} className={MORPH_TRANSITION}>
            <g
              fill={`url(#${hatchId})`}
              clipPath={`url(#${hatchId}-reveal)`}
              stroke="none"
              className="opacity-60"
            >
              <rect
                x={-REACH}
                y={toView(ROWS[2])}
                width={REACH * 2}
                height={(ROWS[3] - ROWS[2]) * SCALE}
              />
              <rect
                x={toView(COLUMNS[1])}
                y={-REACH}
                width={(COLUMNS[2] - COLUMNS[1]) * SCALE}
                height={REACH * 2}
              />
            </g>
            {/* the guides are the team. only the stroke takes the pointer, and the editor above it wins */}
            <a
              href="/careers"
              tabIndex={-1}
              onPointerOver={handleGuidePointerOver}
              onPointerOut={handleGuidePointerOut}
              className="cursor-pointer"
            >
              {guides.map(([x1, y1, x2, y2], index) => (
                <line
                  key={`${x1}:${y1}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  pathLength={1}
                  strokeWidth={12}
                  data-glyph-line
                  data-guide={`icon:${x1}:${y1}`}
                  data-glyph-highlight={
                    hoveredGuide === `icon:${x1}:${y1}` ? CAREERS_GUIDE_TEXT : undefined
                  }
                  style={{ animationDelay: `${index * 40}ms` }}
                  className={cn(
                    '[stroke-dasharray:1] pointer-fine:[pointer-events:stroke]',
                    'motion-safe:group-data-glyph-lines-ready/guides:animate-draw-line'
                  )}
                />
              ))}
              {wordmarkGuides.map(([x1, y1, x2, y2], index) => (
                <line
                  key={`${x1}:${y1}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  pathLength={1}
                  strokeWidth={12}
                  data-glyph-line
                  data-guide={`wordmark:${x1}:${y1}`}
                  data-glyph-highlight={
                    hoveredGuide === `wordmark:${x1}:${y1}` ? CAREERS_GUIDE_TEXT : undefined
                  }
                  style={{
                    transitionDelay: `${getDrawDelay({ index, count: wordmarkGuides.length, isDrawn: isWordmark })}ms`,
                  }}
                  className={cn(
                    '[stroke-dasharray:1] transition-all duration-700 ease-out',
                    'motion-reduce:transition-none',
                    isWordmark
                      ? '[stroke-dashoffset:0] pointer-fine:[pointer-events:stroke]'
                      : '[stroke-dashoffset:1]'
                  )}
                />
              ))}
            </a>
          </g>
        </svg>
      </div>
      <div
        ref={canvasRef}
        aria-hidden
        onPointerDown={handleCanvasPointerDown}
        style={{ width, height }}
        className="pointer-events-none relative shrink-0"
      >
        <svg
          {...svgProps}
          className="control-surface-shadows raised-svg-surface absolute inset-0 overflow-visible"
        >
          <g style={shiftStyle} className={MORPH_TRANSITION}>
            <defs>
              <linearGradient
                id={gradientId}
                x1={0}
                y1={0}
                x2={0}
                y2={SYMBOL_HEIGHT}
                gradientUnits="userSpaceOnUse"
              >
                <stop />
                <stop offset={1} />
              </linearGradient>
              <filter id={`${gradientId}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx={0} dy={1 / SCALE} stdDeviation={1.5 / SCALE} />
              </filter>
            </defs>
            <g
              transform={contentTransform}
              onClick={handleLogoClick}
              className="pointer-events-auto cursor-pointer"
            >
              <RaisedPaths
                paths={[{ key: SYMBOL_OUTLINE, d: symbolPath }]}
                gradientId={gradientId}
              />
            </g>
            <g
              transform={contentTransform}
              onClick={handleLogoClick}
              className={cn(
                'cursor-pointer',
                MORPH_TRANSITION,
                isWordmark ? 'pointer-events-auto opacity-100 delay-700' : 'opacity-0'
              )}
            >
              <RaisedPaths
                paths={LETTER_PATHS.map((key, index) => ({ key, d: letterPaths[index] }))}
                gradientId={gradientId}
              />
            </g>
            <g transform={contentTransform} strokeWidth={1 / SCALE} data-raised-edge>
              <path d={symbolPath} />
              {LETTER_PATHS.map((key, index) => (
                <path
                  key={key}
                  d={letterPaths[index]}
                  pathLength={1}
                  style={{
                    transitionDelay: `${getDrawDelay({ index, count: LETTER_PATHS.length, isDrawn: isWordmark })}ms`,
                  }}
                  className={cn(
                    '[stroke-dasharray:1] transition-all duration-700 ease-out',
                    'motion-reduce:transition-none',
                    isWordmark ? '[stroke-dashoffset:0]' : '[stroke-dashoffset:1]'
                  )}
                />
              ))}
            </g>
          </g>
        </svg>
        <svg {...svgProps} className="pointer-events-none absolute inset-0 overflow-visible">
          <g style={shiftStyle} className={MORPH_TRANSITION}>
            {selected && selectedNode ? (
              <g className="stroke-blue-900">
                {handleViews.map(({ target, view }) => (
                  <line
                    key={target}
                    x1={toView(selectedNode.point[0])}
                    y1={toView(selectedNode.point[1])}
                    x2={toView(view[0])}
                    y2={toView(view[1])}
                  />
                ))}
              </g>
            ) : null}
            <g strokeWidth={1}>
              {shapes.map((shape, shapeIndex) => (
                <g
                  key={INITIAL_SHAPES[shapeIndex][0][0].id}
                  className={cn(
                    shapeIndex > 0 && MORPH_TRANSITION,
                    isShapeShown(shapeIndex) ? 'pointer-events-auto opacity-100' : 'opacity-0'
                  )}
                >
                  {shape.map((nodes, subpathIndex) =>
                    nodes.map((node, nodeIndex) => (
                      <rect
                        key={node.id}
                        data-shape={shapeIndex}
                        data-subpath={subpathIndex}
                        data-node={nodeIndex}
                        data-target="point"
                        x={toView(node.point[0]) - getAnchorSize(shapeIndex) / 2}
                        y={toView(node.point[1]) - getAnchorSize(shapeIndex) / 2}
                        width={getAnchorSize(shapeIndex)}
                        height={getAnchorSize(shapeIndex)}
                        onPointerDown={handlePointPointerDown}
                        onPointerMove={handlePointPointerMove}
                        onLostPointerCapture={handlePointDragEnd}
                        onDoubleClick={handlePointDoubleClick}
                        className={cn(
                          'touch-none',
                          selectedNode === node
                            ? 'fill-white stroke-blue-900'
                            : 'fill-background stroke-border-stronger'
                        )}
                      />
                    ))
                  )}
                </g>
              ))}
            </g>
            {selected && selectedNode ? (
              <g className="pointer-events-auto fill-white stroke-blue-900" strokeWidth={1}>
                {handleViews.map(({ target, view }) => (
                  <circle
                    key={target}
                    data-shape={selected.shape}
                    data-subpath={selected.subpath}
                    data-node={selected.node}
                    data-target={target}
                    cx={toView(view[0])}
                    cy={toView(view[1])}
                    r={2.5}
                    onPointerDown={handlePointPointerDown}
                    onPointerMove={handlePointPointerMove}
                    onLostPointerCapture={handlePointDragEnd}
                    onDoubleClick={handlePointDoubleClick}
                    className="touch-none"
                  />
                ))}
              </g>
            ) : null}
          </g>
        </svg>
      </div>
      {/* the drawing is aria-hidden, so a visually hidden button is the keyboard path to the same toggle */}
      <button
        type="button"
        tabIndex={0}
        aria-pressed={isWordmark}
        onClick={handleLogoClick}
        className={cn(
          'sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:bottom-0',
          'rounded-md border border-default bg-surface-100 px-2 py-1 text-xs text-foreground focus-ring'
        )}
      >
        Show wordmark
      </button>
    </div>
  )
}

// muted is translucent, so an opaque base under it carries the drop shadow and keeps the guides from showing through
const RaisedPaths = ({ paths, gradientId }: RaisedPathsProps) => (
  <>
    <g filter={`url(#${gradientId}-shadow)`} className="fill-background">
      {paths.map(({ key, d }) => (
        <path key={key} d={d} />
      ))}
    </g>
    <g className="fill-card dark:fill-muted">
      {paths.map(({ key, d }) => (
        <path key={key} d={d} />
      ))}
    </g>
    <g fill={`url(#${gradientId})`}>
      {paths.map(({ key, d }) => (
        <path key={key} d={d} />
      ))}
    </g>
  </>
)
