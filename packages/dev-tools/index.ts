import type { ReactNode } from 'react'

import * as DevToolbarModule from './DevToolbar'
import * as DevToolbarContextModule from './DevToolbarContext'
import * as DevToolbarTriggerModule from './DevToolbarTrigger'
import type { DevTelemetryToolbarContextType } from './types'

// Tree-shaking pattern: conditionally export stubs outside local/staging.
// The bundler replaces NEXT_PUBLIC_ENVIRONMENT at build time, making the
// ternary static. In production builds (env === 'prod'), the implementation
// modules are eliminated from the bundle.
// Duplicated for tree-shaking — bundler must see literal process.env reference.
// Keep in sync: DevToolbarContext.tsx, DevToolbar.tsx, DevToolbarTrigger.tsx, feature-flags.tsx
const env = process.env.NEXT_PUBLIC_ENVIRONMENT
const isToolbarEnabled = env === 'local' || env === 'staging'

const noopContext: DevTelemetryToolbarContextType = {
  isEnabled: false,
  isOpen: false,
  setIsOpen: () => {},
  events: [],
  setEvents: () => {},
  dismissToolbar: () => {},
}

export const DevToolbarProvider = !isToolbarEnabled
  ? ({ children }: { children: ReactNode; apiUrl?: string }) => children
  : DevToolbarContextModule.DevToolbarProvider

export const useDevToolbar = !isToolbarEnabled
  ? () => noopContext
  : DevToolbarContextModule.useDevToolbar

export const DevToolbar = !isToolbarEnabled
  ? (_props: { extraTabs?: import('./types').ExtraTab[] }) => null
  : DevToolbarModule.DevToolbar

export const DevToolbarTrigger = !isToolbarEnabled
  ? () => null
  : DevToolbarTriggerModule.DevToolbarTrigger

export type { DevTelemetryEvent, DevToolbarConfig, ExtraTab } from './types'
