import { proxy } from 'valtio'

export const helpPanelState = proxy<{
  requestedView: 'home' | 'support'
}>({
  requestedView: 'home',
})
