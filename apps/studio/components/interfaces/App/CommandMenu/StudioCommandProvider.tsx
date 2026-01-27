import { LOCAL_STORAGE_KEYS } from 'common'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useStudioCommandMenuTelemetry } from 'hooks/misc/useStudioCommandMenuTelemetry'
import type { PropsWithChildren } from 'react'
import { CommandProvider } from 'ui-patterns/CommandMenu'

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
