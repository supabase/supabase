import { useCallback } from 'react'

import type { CommandMenuOpenedEvent } from 'common/telemetry-constants'

export type CommandMenuTelemetryCallback = (event: CommandMenuOpenedEvent) => void

export interface UseCommandMenuTelemetryOptions {
  /**
   * The app where the command menu is being used
   */
  app: 'studio' | 'docs' | 'www'
  /**
   * Optional callback to send telemetry events
   */
  onTelemetry?: CommandMenuTelemetryCallback
}

export function useCommandMenuTelemetry({ app, onTelemetry }: UseCommandMenuTelemetryOptions) {
  const sendTelemetry = useCallback(
    (
      trigger: 'keyboard_shortcut' | 'search_input',
      groups: Partial<CommandMenuOpenedEvent['groups']> = {}
    ) => {
      if (!onTelemetry) return

      const event: CommandMenuOpenedEvent = {
        action: 'command_menu_opened',
        properties: {
          trigger,
          app,
        },
        groups: groups as CommandMenuOpenedEvent['groups'],
      }

      onTelemetry(event)
    },
    [app, onTelemetry]
  )

  return { sendTelemetry }
}
