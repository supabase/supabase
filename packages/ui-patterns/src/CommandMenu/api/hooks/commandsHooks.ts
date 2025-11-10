'use client'

import { isEqual } from 'lodash'
import { useEffect, useMemo, useRef } from 'react'
import { useSnapshot } from 'valtio'

import { useCommandContext } from '../../internal/Context'
import { PageDefinition, isCommandsPage } from '../../internal/state/pagesState'
import type { CommandOptions, ICommand } from '../types'
import { useCurrentPage } from './pagesHooks'

const useCommands = () => {
  const { commandsState } = useCommandContext()
  const { commandSections } = useSnapshot(commandsState)

  const _currPage = useCurrentPage()
  const currPage = _currPage as PageDefinition
  if (currPage && isCommandsPage(currPage)) return currPage.sections

  return commandSections
}

const useRegisterCommands = (
  sectionName: string,
  commands: ICommand[],
  options: CommandOptions = {}
) => {
  const { commandsState } = useCommandContext()
  const { registerSection } = useSnapshot(commandsState)

  const prevDeps = useRef(options?.deps)
  options.enabled ??= true
  const prevEnabled = useRef<boolean | undefined>(options.enabled)

  const unsubscribe = useRef<() => void>(null)

  /**
   * useEffect handles the registration on first render, since React runs the
   * first render twice in development. (Otherwise the first render would leave
   * a dangling subscription.)
   *
   * It also handles final cleanup, since useMemo can't do this.
   *
   * useMemo handles the registration on subsequent renders, to ensure it
   * happens synchronously.
   */
  useMemo(() => {
    if (!isEqual(prevDeps.current, options.deps) || prevEnabled.current !== options.enabled) {
      unsubscribe.current?.()

      unsubscribe.current = options.enabled ? registerSection(sectionName, commands, options) : null

      prevDeps.current = options.deps
      prevEnabled.current = options.enabled
    }
  }, [registerSection, sectionName, commands, options])

  useEffect(() => {
    unsubscribe.current = options.enabled ? registerSection(sectionName, commands, options) : null

    return () => unsubscribe.current?.()
  }, [])
}

export { useCommands, useRegisterCommands }
