'use client'

import { IllustrationFrame } from './IllustrationFrame'
import { JoinChatFeed } from './JoinChatFeed'

export function PresenceIllustration() {
  return (
    <IllustrationFrame>
      <JoinChatFeed scale={1.5} rotateX={20} />
    </IllustrationFrame>
  )
}
