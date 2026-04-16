import type { PropsWithChildren } from 'react'
import { CommandProvider } from 'ui-patterns/CommandMenu'

import { useStudioCommandMenuTelemetry } from '@/hooks/misc/useStudioCommandMenuTelemetry'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcutStateSnapshot } from '@/state/shortcuts/state'

export function StudioCommandProvider({ children }: PropsWithChildren) {
  const { onTelemetry } = useStudioCommandMenuTelemetry()
  const { disabled } = useShortcutStateSnapshot()
  const commandMenuHotkeyEnabled = !disabled[SHORTCUT_IDS.COMMAND_MENU_OPEN]

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
