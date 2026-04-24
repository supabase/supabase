import { ReactNode } from 'react'

import type { ShortcutId } from '@/state/shortcuts/registry'

export interface Route {
  key: string
  label: string
  icon: ReactNode
  link?: string
  disabled?: boolean
  linkElement?: ReactNode
  items?: any | Route[]
  /**
   * Binds a registered keyboard shortcut to this route when set. The sidebar
   * entry shows the keybind on hover and jumps to `link` when the shortcut
   * fires. Ignored if `link` is not set.
   */
  shortcutId?: ShortcutId
}
