'use client'

import type { PropsWithChildren } from 'react'

import { CommandProvider } from 'ui-patterns/CommandMenu'
import { useDocsCommandMenuTelemetry } from '@/hooks/useDocsCommandMenuTelemetry'

export function DocsCommandProvider({ children }: PropsWithChildren) {
  const { onTelemetry } = useDocsCommandMenuTelemetry()

  return (
    <CommandProvider app="docs" onTelemetry={onTelemetry}>
      {children}
    </CommandProvider>
  )
}
