import type { PropsWithChildren } from 'react'

import { CommandProvider } from 'ui-patterns/CommandMenu'
import { useStudioCommandMenuTelemetry } from 'hooks/misc/useStudioCommandMenuTelemetry'

export function StudioCommandProvider({ children }: PropsWithChildren) {
  const { onTelemetry } = useStudioCommandMenuTelemetry()

  return (
    <CommandProvider app="studio" onTelemetry={onTelemetry}>
      {children}
    </CommandProvider>
  )
}
