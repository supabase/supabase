import { type ReactNode } from 'react'

type ICommand = IActionCommand | IRouteCommand

interface IBaseCommand {
  id: string
  name: string
  value?: string
  className?: string
  forceMount?: boolean
  badge?: () => ReactNode
  icon?: () => ReactNode
  /**
   * Whether the item should be hidden until searched
   */
  defaultHidden?: boolean
  /**
   * Curerntly unused
   */
  keywords?: string[]
  /**
   * Currently unused
   */
  shortcut?: string
}

interface IActionCommand extends IBaseCommand {
  action: () => void
}

interface IRouteCommand extends IBaseCommand {
  route: `/${string}` | `http${string}`
}

export type { ICommand }
