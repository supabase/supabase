import { useCallback, type RefObject } from 'react'
import { cn } from 'ui'

import { startGlyphLines } from './start-glyph-lines'

export interface GlyphLinesProps {
  linesRef: RefObject<SVGSVGElement | null>
  text: string
  className?: string
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
