import type { PropsWithChildren } from 'react'
import { CommandProvider } from 'ui-patterns/CommandMenu'

import { useStudioCommandMenuTelemetry } from '@/hooks/misc/useStudioCommandMenuTelemetry'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useIsShortcutEnabled } from '@/state/shortcuts/useIsShortcutEnabled'

export function StudioCommandProvider({ children }: PropsWithChildren) {
  const { onTelemetry } = useStudioCommandMenuTelemetry()
  const commandMenuHotkeyEnabled = useIsShortcutEnabled(SHORTCUT_IDS.COMMAND_MENU_OPEN)

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
