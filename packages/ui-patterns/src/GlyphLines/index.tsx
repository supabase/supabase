import { useCallback, type RefObject } from 'react'
import { cn } from 'ui'

export interface GlyphLinesProps {
  linesRef: RefObject<SVGSVGElement | null>
  text: string
  className?: string
}

interface Pulse {
  line: SVGLineElement
  head: number
  end: number
  speed: number
}

interface GlyphLine {
  line: SVGLineElement
  start: Point
  direction: Point
  from: number
  to: number
  step: number
  textOffset: number
}

type Point = [number, number]

// in css px. glyphs this small read as a line at 100%, and as text once the page is zoomed in
const GLYPH_SIZE = 2.2
const PULSE_LENGTH = 140
// px past the canvas edge where glyphs still draw, so a glyph does not pop in at the edge
const EDGE = 24

const opaqueColors = new Map<string, string>()

// border tokens have alpha, and alpha adds up where glyphs overlap. so glyphs draw in the opaque color the token gives over the surface
export const toOpaque = (color: string, surface: string): string => {
  if (color === surface) return color
  const key = `${color}|${surface}`
  const cached = opaqueColors.get(key)
  if (cached) return cached
  const probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
  if (!probe) return color
  probe.canvas.width = 1
  probe.canvas.height = 1
  probe.fillStyle = surface
  probe.fillRect(0, 0, 1, 1)
  probe.fillStyle = color
  probe.fillRect(0, 0, 1, 1)
  const [red, green, blue] = probe.getImageData(0, 0, 1, 1).data
  const opaque = `rgb(${red} ${green} ${blue})`
  opaqueColors.set(key, opaque)
  return opaque
}

const startGlyphLines = ({
  canvas,
  linesRef,
  text,
}: {
  canvas: HTMLCanvasElement
  linesRef: RefObject<SVGSVGElement | null>
  text: string
}) => {
  const context = canvas.getContext('2d')
  // the glyphs at rest draw once into this layer, and only again when the lines move or the zoom changes
  const layer = document.createElement('canvas')
  const layerContext = layer.getContext('2d')
  if (!context || !layerContext || !text) return
  const isReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  let pulses: Pulse[] = []
  let layerKey = ''
  let last = performance.now()
  let frame = 0

  const draw = (now: number) => {
    frame = requestAnimationFrame(draw)
    const elapsed = Math.min(now - last, 100)
    last = now
    const svg = linesRef.current
    const box = canvas.getBoundingClientRect()
    if (!svg || !box.width || box.bottom < 0 || box.top > innerHeight) return
    // the svg can start its draw-in from this attribute. the next frame reads the first animated dash
    if (!svg.hasAttribute('data-glyph-lines-ready')) {
      svg.setAttribute('data-glyph-lines-ready', '')
      return
    }

    // browser zoom changes the device pixel ratio, and a pinch zoom changes the visual viewport scale
    const ratio = Math.min(
      devicePixelRatio * (visualViewport?.scale ?? 1),
      // safari blanks a canvas past about 16M px, so a deep pinch zoom caps the resolution
      Math.sqrt(16_000_000 / (box.width * box.height))
    )
    const width = Math.round(box.width * ratio)
    const height = Math.round(box.height * ratio)
    const style = getComputedStyle(canvas)
    const font = `${GLYPH_SIZE}px ${style.fontFamily}`
    const svgBox = svg.getBoundingClientRect()
    const lines = [...svg.querySelectorAll<SVGLineElement>('line[data-glyph-line]')]
    const origin: Point = [svgBox.left - box.left, svgBox.top - box.top]
    const glyphLines = lines.flatMap((line, lineIndex) =>
      toGlyphLine({ line, lineIndex, origin, size: [box.width, box.height] })
    )
    const toScreen = ({ start, direction }: GlyphLine, distance: number): Point => [
      start[0] + direction[0] * distance,
      start[1] + direction[1] * distance,
    ]

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
    }
    // a theme change swaps the color, so it is part of the key too
    const key = [
      style.color,
      style.caretColor,
      font,
      // the glyphs draw in a fallback font until the web font loads
      document.fonts.status,
      ...[
        width,
        height,
        ...glyphLines.flatMap((glyphLine) => [...glyphLine.start, glyphLine.from, glyphLine.to]),
      ].map((value) => value.toFixed(2)),
    ].join()

    if (key !== layerKey) {
      layerKey = key
      layer.width = width
      layer.height = height
      layerContext.setTransform(ratio, 0, 0, ratio, 0, 0)
      const color = toOpaque(style.color, style.caretColor)
      layerContext.font = font
      layerContext.textAlign = 'center'
      layerContext.textBaseline = 'middle'
      glyphLines.forEach((glyphLine) => {
        const indexes: number[] = []
        for (
          let index = Math.ceil(glyphLine.from / glyphLine.step);
          index * glyphLine.step <= glyphLine.to;
          index++
        ) {
          indexes.push(index)
        }
        // each glyph cell fills with the caret color first, so a line hides the glyphs of a line it crosses.
        // without a caret color, the caret color is the text color, and the cells would hide the glyphs
        if (color !== style.caretColor) {
          layerContext.beginPath()
          for (const index of indexes) {
            const [x, y] = toScreen(glyphLine, index * glyphLine.step)
            layerContext.rect(
              x - GLYPH_SIZE * 0.325,
              y - GLYPH_SIZE * 0.5,
              GLYPH_SIZE * 0.65,
              GLYPH_SIZE
            )
          }
          layerContext.fillStyle = style.caretColor
          layerContext.fill()
        }
        layerContext.fillStyle = color
        for (const index of indexes) {
          const char = text[(index + glyphLine.textOffset) % text.length]
          if (char === ' ') continue
          layerContext.fillText(char, ...toScreen(glyphLine, index * glyphLine.step))
        }
      })
    }

    context.setTransform(1, 0, 0, 1, 0, 0)
    context.clearRect(0, 0, width, height)
    context.drawImage(layer, 0, 0)

    pulses = pulses
      .map((pulse) => ({ ...pulse, head: pulse.head + pulse.speed * elapsed }))
      .filter((pulse) => (pulse.end - pulse.head) * Math.sign(pulse.speed) > 0)
    context.setTransform(ratio, 0, 0, ratio, 0, 0)
    const pulseColor = toOpaque(
      style.getPropertyValue('--glyph-lines-pulse') || style.color,
      style.caretColor
    )
    context.fillStyle = pulseColor
    context.shadowColor = pulseColor
    context.shadowBlur = 4
    context.font = font
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    pulses.forEach((pulse) => {
      const glyphLine = glyphLines.find(({ line }) => line === pulse.line)
      if (!glyphLine) return
      const tail = pulse.head - Math.sign(pulse.speed) * PULSE_LENGTH
      const from = Math.max(Math.min(pulse.head, tail), glyphLine.from)
      const to = Math.min(Math.max(pulse.head, tail), glyphLine.to)
      for (let index = Math.ceil(from / glyphLine.step); index * glyphLine.step <= to; index++) {
        const char = text[(index + glyphLine.textOffset) % text.length]
        if (char === ' ') continue
        const behind = Math.abs(pulse.head - index * glyphLine.step)
        context.globalAlpha = 1 - behind / PULSE_LENGTH
        context.fillText(char, ...toScreen(glyphLine, index * glyphLine.step))
      }
    })
    context.globalAlpha = 1
    context.shadowBlur = 0

    if (isReducedMotion || pulses.length >= 3 || !glyphLines.length) return
    // a new pulse starts about every 1800ms
    if (Math.random() > elapsed / 1800) return
    const glyphLine = glyphLines[Math.floor(Math.random() * glyphLines.length)]
    const isForward = Math.random() < 0.5
    pulses.push({
      line: glyphLine.line,
      speed: (0.25 + Math.random() * 0.35) * (isForward ? 1 : -1),
      head: isForward ? glyphLine.from : glyphLine.to,
      end: isForward ? glyphLine.to + PULSE_LENGTH : glyphLine.from - PULSE_LENGTH,
    })
  }

  frame = requestAnimationFrame(draw)
  return () => cancelAnimationFrame(frame)
}

const toGlyphLine = ({
  line,
  lineIndex,
  origin,
  size,
}: {
  line: SVGLineElement
  lineIndex: number
  origin: Point
  size: Point
}): GlyphLine[] => {
  // the dash runs from 1 (hidden) to 0 (drawn) along a pathLength of 1
  const drawn =
    1 - Math.min(Math.max(parseFloat(getComputedStyle(line).strokeDashoffset) || 0, 0), 1)
  if (!drawn) return []
  // the line's own ctm holds the transforms of its parent groups
  const matrix = line.getCTM()
  const toCanvas = (x: number, y: number): Point => {
    const point = new DOMPoint(x, y).matrixTransform(matrix ?? undefined)
    return [origin[0] + point.x, origin[1] + point.y]
  }
  const start = toCanvas(line.x1.baseVal.value, line.y1.baseVal.value)
  const end = toCanvas(line.x2.baseVal.value, line.y2.baseVal.value)
  const length = Math.hypot(end[0] - start[0], end[1] - start[1])
  const range = clipToBox({ from: start, to: end, size })
  if (!length || !range) return []
  const direction: Point = [(end[0] - start[0]) / length, (end[1] - start[1]) / length]
  return [
    {
      line,
      start,
      direction,
      from: range[0] * length,
      to: Math.min(range[1], drawn) * length,
      // an upright glyph box is 0.65 wide and 1 tall, so the step is the box size along the line.
      // rows and columns keep their spacing, and diagonal glyphs do not overlap
      step: GLYPH_SIZE * (Math.abs(direction[0]) * 0.65 + Math.abs(direction[1])),
      // each line starts at a different place in the text, so neighbor lines do not repeat
      textOffset: lineIndex * 1009,
    },
  ]
}

// the part of the segment inside the box, as fractions of the segment
const clipToBox = ({ from, to, size }: { from: Point; to: Point; size: Point }): Point | null => {
  const delta = [to[0] - from[0], to[1] - from[1]]
  const checks = [
    [-delta[0], from[0] + EDGE],
    [delta[0], size[0] + EDGE - from[0]],
    [-delta[1], from[1] + EDGE],
    [delta[1], size[1] + EDGE - from[1]],
  ]
  return checks.reduce<Point | null>(
    (current, [p, q]) => {
      if (!current) return null
      if (p === 0) return q < 0 ? null : current
      const fraction = q / p
      const next: Point =
        p < 0
          ? [Math.max(current[0], fraction), current[1]]
          : [current[0], Math.min(current[1], fraction)]
      return next[0] > next[1] ? null : next
    },
    [0, 1]
  )
}

export const GlyphLines = ({ linesRef, text, className }: GlyphLinesProps) => {
  // the loop reads the lines from the dom on every frame, so a change to the lines does not restart it
  const handleCanvasRef = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      if (!canvas) return
      return startGlyphLines({ canvas, linesRef, text })
    },
    [linesRef, text]
  )

  return (
    <canvas ref={handleCanvasRef} aria-hidden className={cn('pointer-events-none', className)} />
  )
}
