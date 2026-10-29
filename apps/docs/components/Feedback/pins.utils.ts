import { upperFirst } from 'lodash-es'
import { cn } from 'ui'

import { getRoleNoun } from './element-descriptor.utils'
import type { FeedbackPin } from './feedback-schema'

// a pin is only a descriptor, so this map keeps the link to its element
export const PINNED_ELEMENTS = new WeakMap<FeedbackPin, Element>()

export const ELEMENT_HIGHLIGHT_CLASSES = cn(
  'pointer-events-none fixed left-0 top-0 z-[60] rounded-sm',
  'border border-brand-600 dark:border-brand'
)

export const getPinNoun = (pin: FeedbackPin): string => upperFirst(getRoleNoun(pin.role))

export const getPinLabel = (pin: FeedbackPin): string =>
  `${getPinNoun(pin)} · ${pin.headingText ?? pin.name ?? pin.text ?? pin.pathname}`
