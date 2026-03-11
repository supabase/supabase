'use client'

import type {
  CommandMenuCommandClickedEvent,
  CommandMenuOpenedEvent,
  CommandMenuSearchSubmittedEvent,
} from 'common/telemetry-constants'
import { useCallback } from 'react'

import { useCommandMenuTelemetryContext } from './useCommandMenuTelemetryContext'
import { useCommandMenuOpen } from './viewHooks'

export type CommandMenuTelemetryCallback = (
  event: CommandMenuOpenedEvent | CommandMenuCommandClickedEvent | CommandMenuSearchSubmittedEvent
) => void

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
      triggerType: 'keyboard_shortcut' | 'search_input' = 'search_input',
      groups: Partial<CommandMenuOpenedEvent['groups']> = {},
      triggerLocation?: string
    ) => {
      if (!onTelemetry) return

      const event: CommandMenuOpenedEvent = {
        action: 'command_menu_opened',
        properties: {
          trigger_type: triggerType,
          trigger_location: triggerLocation,
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

export const useCommandMenuOpenedTelemetry: (
  trigger?: 'keyboard_shortcut' | 'search_input'
) => () => void = (trigger = 'search_input') => {
  const telemetryContext = useCommandMenuTelemetryContext()
  const open = useCommandMenuOpen()

  const sendTelemetry = useCallback(() => {
    if (!open && telemetryContext?.onTelemetry) {
      const event = {
        action: 'command_menu_opened' as const,
        properties: {
          trigger_type: trigger,
          location: 'user_dropdown_menu',
          app: telemetryContext.app,
        },
        groups: {},
      }

      telemetryContext.onTelemetry(event)
    }
  }, [open, trigger, telemetryContext])

  return sendTelemetry
}
