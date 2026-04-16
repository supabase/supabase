import { HotkeySequence } from '@tanstack/react-hotkeys'

export interface ShortcutOptions {
  enabled?: boolean
  timeout?: number
}

export interface ShortcutDefinition {
  id: string
  label: string
  description?: string
  sequence: HotkeySequence

  options?: ShortcutOptions
}
