import type { ReactNode } from 'react'

import * as DevToolbarModule from './DevToolbar'
import * as DevToolbarContextModule from './DevToolbarContext'
import * as DevToolbarTriggerModule from './DevToolbarTrigger'
import type { DevTelemetryToolbarContextType } from './types'

// Tree-shaking pattern: conditionally export stubs in production
// The bundler replaces process.env.NODE_ENV at build time, making the
// ternary static. Combined with sideEffects: false, the implementation
// modules are eliminated from the production bundle.

const noopContext: DevTelemetryToolbarContextType = {
  isEnabled: false,
  isOpen: false,
  setIsOpen: () => {},
  events: [],
  setEvents: () => {},
  dismissToolbar: () => {},
}

export const DevToolbarProvider =
  process.env.NODE_ENV !== 'development'
    ? ({ children }: { children: ReactNode; apiUrl?: string }) => children
    : DevToolbarContextModule.DevToolbarProvider

export const useDevToolbar =
  process.env.NODE_ENV !== 'development' ? () => noopContext : DevToolbarContextModule.useDevToolbar

export const DevToolbar =
  process.env.NODE_ENV !== 'development' ? () => null : DevToolbarModule.DevToolbar

export const DevToolbarTrigger =
  process.env.NODE_ENV !== 'development' ? () => null : DevToolbarTriggerModule.DevToolbarTrigger

export type { DevTelemetryEvent, DevToolbarConfig } from './types'
