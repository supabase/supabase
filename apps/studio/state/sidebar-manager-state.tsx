import { LOCAL_STORAGE_KEYS } from 'common/constants'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { ReactNode, useEffect } from 'react'
import { proxy, snapshot, useSnapshot } from 'valtio'

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
}

const INITIAL_SIDEBAR_MANAGER_DATA: SidebarManagerData = {
  sidebars: {},
  activeSidebar: undefined,
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
    },

    unregisterSidebar(id: string) {
      const panel = state.sidebars[id]
      if (!panel) return

      delete state.sidebars[id]

      if (state.activeSidebar?.id === id) {
        state.activeSidebar = undefined
        panel.onClose?.()
      }
    },

    openSidebar(id: string) {
      const panel = state.sidebars[id]
      if (!panel) {
        console.warn(`Sidebar "${id}" is not registered. Register it before opening.`)
        return
      }

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
      return
    },

    isSidebarOpen(id: string) {
      return state.activeSidebar?.id === id
    },

    closeActive() {
      if (!state.activeSidebar) return
      state.activeSidebar?.onClose?.()
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
  hotKey?: string
) => {
  const [isSidebarHotkeyEnabled] = useLocalStorageQuery<boolean>(
    LOCAL_STORAGE_KEYS.HOTKEY_SIDEBAR(id),
    true
  )

  useEffect(() => {
    const { registerSidebar, unregisterSidebar } = sidebarManagerState

    registerSidebar(id, component, handlers)

    return () => {
      unregisterSidebar(id)
    }
  }, [id])

  useEffect(() => {
    if (!hotKey) return

    function hotKeyHandler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === hotKey && !e.altKey && !e.shiftKey) {
        sidebarManagerState.toggleSidebar(id)
      }
    }

    if (isSidebarHotkeyEnabled) {
      window.addEventListener('keydown', hotKeyHandler)
      return () => {
        window.removeEventListener('keydown', hotKeyHandler)
      }
    }
  }, [id, hotKey, isSidebarHotkeyEnabled])
}
