import { cn } from 'ui'

import { getRoleNoun } from './element-descriptor.utils'
import type { FeedbackPin } from './feedback-schema'

// pins are descriptors and can't be matched back to their element
export const PINNED_ELEMENTS = new WeakMap<FeedbackPin, Element>()

export const ELEMENT_HIGHLIGHT_CLASSES = cn(
  'pointer-events-none fixed left-0 top-0 z-[60] rounded-sm',
  'border border-brand-600 dark:border-brand'
)

export const getPinNoun = (pin: FeedbackPin): string => {
  const noun = getRoleNoun(pin.role)
  return `${noun.charAt(0).toUpperCase()}${noun.slice(1)}`
}

export const getPinLabel = (pin: FeedbackPin): string =>
  `${getPinNoun(pin)} · ${pin.headingText ?? pin.name ?? pin.text ?? pin.pathname}`
