import { cn } from 'ui'

export interface FrameGlyphsProps {
  text: string
  className?: string
}

export const FrameGlyphs = ({ text, className }: FrameGlyphsProps) => (
  <canvas
    data-frame-glyphs={text}
    aria-hidden
    className={cn('pointer-events-none absolute inset-0 size-full', className)}
  />
)
