import { isEqual } from 'lodash'
import { useEffect, useMemo, useRef } from 'react'
import { useSnapshot } from 'valtio'

import type { ICommand, ICommandSectionName, UseCommandOptions } from '../types'
import { useCommandContext } from '../../internal/Context'
import { useCurrentPage } from './pagesHooks'
import { PageDefinition, isCommandsPage } from '../../internal/state/pagesState'

const useCommands = () => {
  const { commandsState } = useCommandContext()
  const { commandSections } = useSnapshot(commandsState)

  const _currPage = useCurrentPage()
  const currPage = _currPage as PageDefinition
  if (currPage && isCommandsPage(currPage)) return currPage.sections

  return commandSections
}

const useRegisterCommands = (
  sectionName: ICommandSectionName,
  commands: ICommand[],
  options: UseCommandOptions = {}
) => {
  const { commandsState } = useCommandContext()
  const { registerSection } = useSnapshot(commandsState)

  const prevDeps = useRef(options?.deps)
  options.enabled ??= true
  const prevEnabled = useRef<boolean | undefined>(options.enabled)

  const unsubscribe = useRef<() => void>()

  /**
   * The double useMemo / useEffect subscription is to handle a pair of
   * intersecting side effects:
   *
   * 1. useMemo ensures that the updates to state happen synchronously
   * 2. useEffect ensures that the first render (which sometimes happens as a
   *    pair of renders, with the second ignoring the refs set by the first)
   *    doesn't leave dangling subscriptions.
   */
  useMemo(() => {
    if (!isEqual(prevDeps.current, options.deps) || prevEnabled.current !== options.enabled) {
      unsubscribe.current?.()

      unsubscribe.current = options.enabled
        ? registerSection(sectionName, commands, options)
        : undefined

      prevDeps.current = options.deps
      prevEnabled.current = options.enabled
    }
  }, [registerSection, sectionName, commands, options])

  useEffect(() => {
    unsubscribe.current = options.enabled
      ? registerSection(sectionName, commands, options)
      : undefined

    return () => unsubscribe.current?.()
  }, [])
}

export { useCommands, useRegisterCommands }
