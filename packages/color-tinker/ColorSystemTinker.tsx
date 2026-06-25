'use client'

import { Popover } from 'ui'

import { ColorTinkerPanel } from './ColorTinkerPanel'
import { ColorTinkerTrigger } from './ColorTinkerTrigger'
import { useColorTinker } from './ColorTinkerContext'
import { useColorTinkerOverrides } from './useColorTinkerOverrides'

// Duplicated for tree-shaking — bundler must see literal process.env reference.
// Keep in sync: index.ts, ColorTinkerContext.tsx, ColorTinkerTrigger.tsx, useColorTinkerOverrides.ts
const env = process.env.NEXT_PUBLIC_ENVIRONMENT
const IS_COLOR_TINKER_ENABLED = env === 'local' || env === 'staging'

export function ColorSystemTinker() {
  const { isEnabled } = useColorTinker()
  const { values, hasOverrides, updateVar, reset } = useColorTinkerOverrides(isEnabled)

  if (!IS_COLOR_TINKER_ENABLED || !isEnabled) return null

  return (
    <Popover>
      <ColorTinkerTrigger hasOverrides={hasOverrides} />
      <ColorTinkerPanel values={values} updateVar={updateVar} reset={reset} />
    </Popover>
  )
}
