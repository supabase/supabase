import { ReactNode, useEffect } from 'react'
import { proxy, snapshot, useSnapshot } from 'valtio'

import useLatest from '@/hooks/misc/useLatest'

type SidebarHandlers = {
  onOpen?: () => void
  onClose?: () => void
}

type ManagedSidebar = SidebarHandlers & {
  id: string
  component: () => ReactNode | undefined
}

type SidebarManagerData = {
  sidebars: Partial<Record<string, ManagedSidebar>>
  activeSidebar: ManagedSidebar | undefined
  pendingSidebarOpen: string | undefined
}

type SidebarManagerState = SidebarManagerData & {
  registerSidebar: (
    id: string,
    component: () => ReactNode | undefined,
    handlers?: SidebarHandlers
  ) => void
  unregisterSidebar: (id: string) => void
  openSidebar: (id: string) => void
  toggleSidebar: (id: string) => void
  closeSidebar: (id: string) => void
  isSidebarOpen: (id: string) => boolean
  closeActive: () => void
  clearActiveSidebar: () => void
}

const INITIAL_SIDEBAR_MANAGER_DATA: SidebarManagerData = {
  sidebars: {},
  activeSidebar: undefined,
  pendingSidebarOpen: undefined,
}

const createSidebarManagerState = () => {
  const state: SidebarManagerState = proxy({
    ...INITIAL_SIDEBAR_MANAGER_DATA,

    registerSidebar(
      id: string,
      component: () => ReactNode | undefined,
      handlers: SidebarHandlers = {}
    ) {
      state.sidebars[id] = {
        id,
        component,
        ...handlers,
      }

      // If this sidebar was pending to be opened, open it now.
      // This covers both the initial "openSidebar before register" case and
      // the restore-after-transient-unregister case set in unregisterSidebar.
      if (state.pendingSidebarOpen === id) {
        state.pendingSidebarOpen = undefined
        state.openSidebar(id)
      }
    },

    unregisterSidebar(id: string) {
      const panel = state.sidebars[id]
      if (!panel) return

      delete state.sidebars[id]

      // Clear pending open if this sidebar was pending
      if (state.pendingSidebarOpen === id) {
        state.pendingSidebarOpen = undefined
      }

      if (state.activeSidebar?.id === id) {
        state.activeSidebar = undefined
        panel.onClose?.()

        // Queue a restore for when this sidebar re-registers. This handles transient
        // enabled=false cycles (e.g. project briefly undefined during navigation) so
        // the panel snaps back open without the user losing their place.
        // The pending intent is cleared by any explicit user close action
        // (closeSidebar, closeActive, toggleSidebar) so intentional dismissals are respected.
        state.pendingSidebarOpen = id
      }
    },

    openSidebar(id: string) {
      const panel = state.sidebars[id]
      if (!panel) {
        // Queue the request - sidebar will be opened when it gets registered
        state.pendingSidebarOpen = id
        return
      }

      // Clear any pending restore/open request. Opening a registered sidebar
      // is an explicit action that supersedes any queued intent, including
      // the restore-after-transient-unregister set in unregisterSidebar.
      state.pendingSidebarOpen = undefined

      if (state.activeSidebar?.id === id) {
        return
      }

      if (state.activeSidebar && state.activeSidebar.id !== id) {
        const previousPanel = state.activeSidebar
        previousPanel?.onClose?.()
      }

      state.activeSidebar = panel
      panel.onOpen?.()
    },

    toggleSidebar(id: string) {
      const panel = state.sidebars[id]
      if (!panel) {
        console.warn(`Sidebar "${id}" is not registered. Register it before toggling.`)
        return
      }

      if (state.activeSidebar?.id === id) {
        panel.onClose?.()
        state.activeSidebar = undefined
        // User explicitly toggled closed — cancel any pending restore for this sidebar
        if (state.pendingSidebarOpen === id) {
          state.pendingSidebarOpen = undefined
        }
        return
      }

      if (state.activeSidebar && state.activeSidebar.id !== id) {
        const previousPanel = state.activeSidebar
        previousPanel?.onClose?.()
      }

      state.activeSidebar = panel
      panel.onOpen?.()
    },

    closeSidebar(id: string) {
      if (state.activeSidebar?.id !== id) return

      const panel = state.sidebars[id]
      if (!panel) return

      panel.onClose?.()
      state.activeSidebar = undefined
      // User explicitly closed — cancel any pending restore for this sidebar
      if (state.pendingSidebarOpen === id) {
        state.pendingSidebarOpen = undefined
      }
      return
    },

    isSidebarOpen(id: string) {
      return state.activeSidebar?.id === id
    },

    closeActive() {
      if (!state.activeSidebar) return
      const id = state.activeSidebar.id
      state.activeSidebar.onClose?.()
      state.activeSidebar = undefined
      // User explicitly closed — cancel any pending restore for this sidebar
      if (state.pendingSidebarOpen === id) {
        state.pendingSidebarOpen = undefined
      }
    },

    clearActiveSidebar() {
      // Intentionally does not cancel pendingSidebarOpen or call onClose.
      // Used by the mobile UI to displace an open sidebar without treating it
      // as a deliberate user dismissal — the sidebar will still restore if
      // it re-registers while pendingSidebarOpen was already set.
      state.activeSidebar = undefined
    },
  })

  return state
}

export const sidebarManagerState = createSidebarManagerState()

export const getSidebarManagerSnapshot = () => snapshot(sidebarManagerState)

export const useSidebarManagerSnapshot = (options?: Parameters<typeof useSnapshot>[1]) =>
  useSnapshot(sidebarManagerState, options)

export const useRegisterSidebar = (
  id: string,
  component: () => ReactNode,
  handlers: SidebarHandlers = {},
  enabled?: boolean
) => {
  const componentRef = useLatest(component)
  const handlersRef = useLatest(handlers)

  useEffect(() => {
    if (enabled) {
      sidebarManagerState.registerSidebar(id, () => componentRef.current(), handlersRef.current)
    }

    return () => {
      sidebarManagerState.unregisterSidebar(id)
    }
  }, [id, enabled])
}
