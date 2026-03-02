'use client'

import { createContext, useContext } from 'react'

import type { CommandMenuTelemetryCallback } from './useCommandMenuTelemetry'

interface CommandMenuTelemetryContextValue {
  app: 'studio' | 'docs' | 'www'
  onTelemetry?: CommandMenuTelemetryCallback
}

const CommandMenuTelemetryContext = createContext<CommandMenuTelemetryContextValue | null>(null)

export function useCommandMenuTelemetryContext() {
  const context = useContext(CommandMenuTelemetryContext)
  return context
}

export { CommandMenuTelemetryContext }
