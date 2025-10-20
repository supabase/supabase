import { proxy, snapshot, useSnapshot } from 'valtio'

export const SIDEBAR_KEYS = {
  AI_ASSISTANT: 'ai-assistant',
  ADVISOR_CENTER: 'advisor-center',
  EDITOR_PANEL: 'editor-panel',
} as const

export type SidebarKey = (typeof SIDEBAR_KEYS)[keyof typeof SIDEBAR_KEYS]

type SidebarHandlers = {
  onOpen?: () => void
  onClose?: () => void
}

type ManagedSidebar = SidebarHandlers & {
  id: SidebarKey
  open: boolean
}

const createSidebarManagerState = () => {
  const state = proxy({
    panels: {} as Partial<Record<SidebarKey, ManagedSidebar>>,
    activeSidebar: undefined as SidebarKey | undefined,

    registerSidebar(id: SidebarKey, handlers: SidebarHandlers = {}) {
      const existing = state.panels[id]
      state.panels[id] = {
        id,
        open: existing?.open ?? false,
        ...handlers,
      }

      const panel = state.panels[id]
      if (panel.open) {
        handlers.onOpen?.()
      } else {
        handlers.onClose?.()
      }
    },

    unregisterSidebar(id: SidebarKey) {
      const panel = state.panels[id]
      if (!panel) return

      if (panel.open) {
        panel.open = false
        panel.onClose?.()
      }

      delete state.panels[id]

      if (state.activeSidebar === id) {
        state.activeSidebar = undefined
      }
    },

    openSidebar(id: SidebarKey) {
      if (!state.panels[id]) {
        state.registerSidebar(id)
      }

      const panel = state.panels[id]
      if (!panel) return

      if (panel.open) {
        state.activeSidebar = id
        return
      }

      if (state.activeSidebar && state.activeSidebar !== id) {
        state.closeSidebar(state.activeSidebar)
      }

      panel.open = true
      state.activeSidebar = id
      panel.onOpen?.()
    },

    closeSidebar(id: SidebarKey) {
      const panel = state.panels[id]
      if (!panel || !panel.open) return

      panel.open = false
      if (state.activeSidebar === id) {
        state.activeSidebar = undefined
      }
      panel.onClose?.()
    },

    toggleSidebar(id: SidebarKey) {
      if (state.isSidebarOpen(id)) {
        state.closeSidebar(id)
      } else {
        state.openSidebar(id)
      }
    },

    isSidebarOpen(id: SidebarKey) {
      return Boolean(state.panels[id]?.open)
    },

    closeAll() {
      Object.keys(state.panels).forEach((panelId) => {
        state.closeSidebar(panelId as SidebarKey)
      })
    },
  })

  return state
}

export const sidebarManagerState = createSidebarManagerState()

export const getSidebarManagerSnapshot = () => snapshot(sidebarManagerState)

export const useSidebarManagerSnapshot = (
  options?: Parameters<typeof useSnapshot>[1]
) => useSnapshot(sidebarManagerState, options)
