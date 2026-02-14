import type { PropsWithChildren } from 'react'

import { CommandProvider } from 'ui-patterns/CommandMenu'
import { useStudioCommandMenuTelemetry } from 'hooks/misc/useStudioCommandMenuTelemetry'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { LOCAL_STORAGE_KEYS } from 'common'

export function StudioCommandProvider({ children }: PropsWithChildren) {
  const { onTelemetry } = useStudioCommandMenuTelemetry()
  const [commandMenuHotkeyEnabled] = useLocalStorageQuery<boolean>(
    LOCAL_STORAGE_KEYS.HOTKEY_COMMAND_MENU,
    true
  )

  return (
    <CommandProvider
      app="studio"
      onTelemetry={onTelemetry}
      openKey={commandMenuHotkeyEnabled ? 'k' : ''}
    >
      {children}
    </CommandProvider>
  )
}
