import { cn } from 'ui'

import { WARP_PROBES } from '../lib/ascii/probes'
import { ColorProbes } from './ColorProbes'

export interface WarpCanvasProps {
  text: string
  className?: string
}

export const WarpCanvas = ({ text, className }: WarpCanvasProps) => (
  <>
    <canvas
      data-warp-canvas={text}
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 size-full', className)}
    />
    <ColorProbes probes={WARP_PROBES} />
  </>
)
