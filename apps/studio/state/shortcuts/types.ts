export interface ShortcutOptions {
  enabled?: boolean
  timeout?: number
}

export interface ShortcutDefinition {
  id: string
  label: string
  description?: string
  sequence: string[]

  options?: ShortcutOptions
}
