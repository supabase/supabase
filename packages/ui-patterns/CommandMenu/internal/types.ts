import { type ReactNode } from 'react'

export interface IBaseCommand {
  id: string
  name: string
  value?: string
  className?: string
  forceMount?: boolean
  badge?: () => ReactNode
  icon?: () => ReactNode
  defaultHidden?: boolean
}

export interface IActionCommand extends IBaseCommand {
  action: () => void
}

export interface IRouteCommand extends IBaseCommand {
  route: `/${string}` | `http${string}`
}

export type ICommand = IActionCommand | IRouteCommand

export const isActionCommand = (command: ICommand): command is IActionCommand => 'action' in command
export const isRouteCommand = (command: ICommand): command is IRouteCommand => 'route' in command

export interface ICommandSection {
  id: string
  name: string
  commands: ICommand[]
  meta?: any
  forceMount?: boolean
}

export interface ICommandsState {
  commandSections: ICommandSection[]
  registerSection: (
    sectionName: string,
    commands: ICommand[],
    options?: CommandOptions
  ) => () => void
}

export type OrderSectionInstruction = (
  sections: ICommandSection[],
  idx: number
) => ICommandSection[]
export type OrderCommandsInstruction = (
  commands: ICommand[],
  commandsToInsert: ICommand[]
) => Array<ICommand>

export type CommandOptions = {
  deps?: any[]
  enabled?: boolean
  forceMountSection?: boolean
  sectionMeta?: any
  orderSection?: OrderSectionInstruction
  orderCommands?: OrderCommandsInstruction
}
