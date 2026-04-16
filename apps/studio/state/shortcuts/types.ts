import { HotkeySequence } from '@tanstack/react-hotkeys'

export interface ShortcutOptions {
  enabled?: boolean
  timeout?: number
  registerInCommandMenu?: boolean
}

export interface ShortcutDefinition {
  id: string
  label: string
  description?: string
  sequence: HotkeySequence

  options?: ShortcutOptions
}
