import { useCallback } from 'react'
import { cn } from 'ui'
import { toOpaque } from 'ui-patterns/GlyphLines'

import { fillGlyphPath, GLYPH_FONT } from '../lib/ascii/glyph-path'
import { sizeLayers } from '../lib/ascii/layer'
import { observeTheme } from './ColorProbes'

export interface FrameGlyphsProps {
  text: string
  className?: string
}

// a fading line draws in this many pieces, each a little fainter than the last
const FADE_PIECES = 24

export const FrameGlyphs = ({ text, className }: FrameGlyphsProps) => {
  const setupCanvas = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      const host = canvas?.parentElement
      const ctx = canvas?.getContext('2d')
      if (!canvas || !host || !ctx) return
      let frame = 0
      let drawnKey = ''

      const draw = () => {
        // the spans start their draw-out from this attribute. the next frame reads the first animated scale
        if (!host.hasAttribute('data-frame-glyphs-ready')) {
          host.setAttribute('data-frame-glyphs-ready', '')
          frame = requestAnimationFrame(draw)
          return
        }
        const spans = [...host.querySelectorAll<HTMLElement>('[data-glyph-frame]')]
        // a finished draw-out keeps its fill, so getAnimations still returns it. the play state shows that it finished
        const isDrawingOut = spans.some((span) =>
          span.getAnimations().some((animation) => animation.playState !== 'finished')
        )
        if (isDrawingOut) frame = requestAnimationFrame(draw)
        const box = canvas.getBoundingClientRect()
        if (!box.width) return
        const rects = spans.map((span) => span.getBoundingClientRect())
        const style = getComputedStyle(canvas)
        const key = [
          box.width,
          box.height,
          visualViewport?.scale,
          style.color,
          style.caretColor,
          ...rects.flatMap((rect) => [rect.x - box.x, rect.y - box.y, rect.width, rect.height]),
        ].join()
        if (key === drawnKey) return
        drawnKey = key

        sizeLayers({ contexts: [ctx], width: box.width, height: box.height })
        ctx.fillStyle = toOpaque(style.color, style.caretColor)
        ctx.font = GLYPH_FONT
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        rects.forEach((rect, index) => {
          if (!rect.width || !rect.height) return
          const isAcross = rect.width > rect.height
          const x = rect.x - box.x + (isAcross ? 0 : rect.width / 2)
          const y = rect.y - box.y + (isAcross ? rect.height / 2 : 0)
          const length = isAcross ? rect.width : rect.height
          // a span with data-glyph-fade fades out from that fraction of its length to its end
          const fadeFrom = Number(spans[index].dataset.glyphFade ?? 1)
          let offset = index * 1009
          for (let piece = 0; piece < FADE_PIECES; piece++) {
            const from = piece / FADE_PIECES
            const to = (piece + 1) / FADE_PIECES
            ctx.globalAlpha = from < fadeFrom ? 1 : 1 - (from - fadeFrom) / (1 - fadeFrom)
            offset = fillGlyphPath({
              ctx,
              points: [
                { x: x + (isAcross ? length * from : 0), y: y + (isAcross ? 0 : length * from) },
                { x: x + (isAcross ? length * to : 0), y: y + (isAcross ? 0 : length * to) },
              ],
              isClosed: false,
              text,
              offset,
              surface: style.caretColor,
            })
          }
        })
        ctx.globalAlpha = 1
      }

      const redraw = () => {
        cancelAnimationFrame(frame)
        frame = requestAnimationFrame(draw)
      }

      const resizeObserver = new ResizeObserver(redraw)
      resizeObserver.observe(host)
      // a pinch zoom changes only the visual viewport scale, so the canvas redraws for it too
      visualViewport?.addEventListener('resize', redraw)
      const unobserveTheme = observeTheme(redraw)
      return () => {
        cancelAnimationFrame(frame)
        resizeObserver.disconnect()
        visualViewport?.removeEventListener('resize', redraw)
        unobserveTheme()
      }
    },
    [text]
  )

  return (
    <canvas
      ref={setupCanvas}
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 size-full', className)}
    />
  )
}
