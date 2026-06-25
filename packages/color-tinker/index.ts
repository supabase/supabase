import type { ReactNode } from 'react'

import * as ColorSystemTinkerModule from './ColorSystemTinker'
import * as ColorTinkerContextModule from './ColorTinkerContext'
import * as ColorTinkerTriggerModule from './ColorTinkerTrigger'

// Duplicated for tree-shaking — bundler must see literal process.env reference.
// Keep in sync: ColorTinkerContext.tsx, ColorTinkerTrigger.tsx, ColorSystemTinker.tsx
const env = process.env.NEXT_PUBLIC_ENVIRONMENT
const isColorTinkerEnabled = env === 'local' || env === 'staging'

const noopContext = {
  isEnabled: false,
  dismissColorTinker: () => {},
}

// Tree-shaking pattern: conditionally export stubs outside local/staging.
// The bundler replaces NEXT_PUBLIC_ENVIRONMENT at build time, making the
// ternary static. In production builds (env === 'prod'), the implementation
// modules are eliminated from the bundle.
export const ColorTinkerProvider = !isColorTinkerEnabled
  ? ({ children }: { children: ReactNode }) => children
  : ColorTinkerContextModule.ColorTinkerProvider

export const useColorTinker = !isColorTinkerEnabled
  ? () => noopContext
  : ColorTinkerContextModule.useColorTinker

export const ColorTinkerTrigger = !isColorTinkerEnabled
  ? (_props: { hasOverrides?: boolean }) => null
  : ColorTinkerTriggerModule.ColorTinkerTrigger

export const ColorSystemTinker = !isColorTinkerEnabled
  ? () => null
  : ColorSystemTinkerModule.ColorSystemTinker

export type { ColorTinkerContextType, ColorInputConfig, ColorValues, ThemeKey } from './types'
