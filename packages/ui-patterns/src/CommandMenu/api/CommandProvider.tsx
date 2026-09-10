'use client'

import { useConstant } from 'common'
import { useRouter as useLegacyRouter } from 'next/compat/router'
import { useCallback, useEffect, useMemo, type PropsWithChildren } from 'react'

import { CommandContext } from '../internal/Context'
import { initCommandsState } from '../internal/state/commandsState'
import { initPagesState } from '../internal/state/pagesState'
import { initQueryState } from '../internal/state/queryState'
import { initViewState } from '../internal/state/viewState'
import {
  useCommandMenuTelemetry,
  type CommandMenuTelemetryCallback,
} from './hooks/useCommandMenuTelemetry'
import { CommandMenuTelemetryContext } from './hooks/useCommandMenuTelemetryContext'
import { CrossCompatRouterContext } from './hooks/useCrossCompatRouter'
import {
  useCommandMenuOpen,
  useResetCommandMenu,
  useSetCommandMenuOpen,
  useToggleCommandMenu,
} from './hooks/viewHooks'

const CommandProviderInternal = ({ children }: PropsWithChildren) => {
  const combinedState = useConstant(() => ({
    commandsState: initCommandsState(),
    pagesState: initPagesState(),
    queryState: initQueryState(),
    viewState: initViewState(),
  }))

  return <CommandContext.Provider value={combinedState}>{children}</CommandContext.Provider>
}

// This is a component not a hook so it can access the wrapping context.
const CommandShortcut = ({
  openKey,
  app,
  onTelemetry,
}: {
  openKey: string
  app?: 'studio' | 'docs' | 'www'
  onTelemetry?: CommandMenuTelemetryCallback
}) => {
  const toggleOpen = useToggleCommandMenu()
  const isOpen = useCommandMenuOpen()
  const { sendTelemetry } = useCommandMenuTelemetry({
    app: app ?? 'studio',
    onTelemetry,
  })

  useEffect(() => {
    if (openKey === '') return

    const handleKeydown = (evt: KeyboardEvent) => {
      const usesPrimaryModifier = evt.metaKey || evt.ctrlKey
      const otherModifiersActive = evt.altKey || evt.shiftKey
      if (evt.key === openKey && usesPrimaryModifier && !otherModifiersActive) {
        evt.preventDefault()
        toggleOpen()
        !isOpen && sendTelemetry('keyboard_shortcut')
      }
    }

    document.addEventListener('keydown', handleKeydown)

    return () => document.removeEventListener('keydown', handleKeydown)
  }, [isOpen, openKey, sendTelemetry, toggleOpen])

  return null
}

function CloseOnNavigation({ children }: PropsWithChildren) {
  const setIsOpen = useSetCommandMenuOpen()
  const resetCommandMenu = useResetCommandMenu()

  const legacyRouter = useLegacyRouter()
  const isUsingLegacyRouting = !!legacyRouter

  const completeNavigation = useCallback(() => {
    setIsOpen(false)
    resetCommandMenu()
  }, [resetCommandMenu, setIsOpen])

  const ctx = useMemo(
    () => ({
      onPendingEnd: new Set([completeNavigation]),
    }),
    [completeNavigation]
  )

  useEffect(() => {
    if (!isUsingLegacyRouting) return

    legacyRouter.events.on('routeChangeComplete', completeNavigation)
    return () => legacyRouter.events.off('routeChangeComplete', completeNavigation)
  }, [isUsingLegacyRouting, legacyRouter])

  return (
    <CrossCompatRouterContext.Provider value={ctx}>{children}</CrossCompatRouterContext.Provider>
  )
}

interface CommandProviderProps extends PropsWithChildren {
  /**
   * The keyboard shortcut that opens the command menu when used in
   * combination with the meta key.
   *
   * Defaults to `k`. Pass an empty string to disable the keyboard shortcut.
   */
  openKey?: string
  /**
   * The app where the command menu is being used
   */
  app?: 'studio' | 'docs' | 'www'
  /**
   * Optional callback to send telemetry events
   */
  onTelemetry?: CommandMenuTelemetryCallback
}

const CommandProvider = ({ children, openKey, app, onTelemetry }: CommandProviderProps) => (
  <CommandProviderInternal>
    <CommandMenuTelemetryContext.Provider value={{ app: app ?? 'studio', onTelemetry }}>
      <CommandShortcut openKey={openKey ?? 'k'} app={app} onTelemetry={onTelemetry} />
      <CloseOnNavigation>{children}</CloseOnNavigation>
    </CommandMenuTelemetryContext.Provider>
  </CommandProviderInternal>
)

export { CommandProvider }
