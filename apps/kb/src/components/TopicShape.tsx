import { cn } from 'ui'
import type { IsoShapeName } from 'ui-patterns/IsoShape/IsoShape.shapes'

import { TOPIC_SHAPE_PROBES } from '../lib/ascii/probes'
import { ColorProbes } from './ColorProbes'

export interface TopicShapeProps {
  topic: IsoShapeName
  text: string
  isMirrored?: boolean
  className?: string
}

export const TopicShape = ({ topic, text, isMirrored, className }: TopicShapeProps) => (
  <div aria-hidden className={cn(isMirrored && '-scale-x-100', className)}>
    <canvas
      data-topic-shape={topic}
      data-topic-shape-text={text}
      data-mirrored={isMirrored ? '' : undefined}
      className={cn('block size-full', isMirrored && '-scale-x-100')}
    />
    <ColorProbes probes={TOPIC_SHAPE_PROBES} />
  </div>
)
