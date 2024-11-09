import { proxy } from 'valtio'

interface SidebarState {
  isOpen: boolean
}

export const sidebarState = proxy<SidebarState>({
  isOpen: true,
})
