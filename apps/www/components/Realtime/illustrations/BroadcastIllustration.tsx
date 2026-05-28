'use client'

import { BroadcastReactions } from './BroadcastReactions'
import { IllustrationFrame } from './IllustrationFrame'

export function BroadcastIllustration() {
  return (
    <IllustrationFrame interactive>
      <BroadcastReactions />
    </IllustrationFrame>
  )
}
