import { proxy, snapshot, subscribe, useSnapshot } from 'valtio'

import type { ShortcutId } from './registry'

const LOCAL_STORAGE_KEY = 'supabase-shortcut-preferences'

interface ShortcutStateData {
  disabled: Record<string, boolean>
}

function loadDisabled(): Record<string, boolean> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function persistDisabled(disabled: Record<string, boolean>) {
  if (typeof window === 'undefined') return
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(disabled))
}

function createShortcutState() {
  const state = proxy<ShortcutStateData>({
    disabled: loadDisabled(),
  })

  subscribe(state, () => {
    persistDisabled(state.disabled)
  })

  return state
}

export const shortcutState = createShortcutState()

export const useShortcutStateSnapshot = (options?: Parameters<typeof useSnapshot>[1]) =>
  useSnapshot(shortcutState, options)

export const getShortcutStateSnapshot = () => snapshot(shortcutState)

export function isShortcutEnabled(id: ShortcutId): boolean {
  return !shortcutState.disabled[id]
}

export function setShortcutEnabled(id: ShortcutId, enabled: boolean) {
  if (enabled) {
    delete shortcutState.disabled[id]
  } else {
    shortcutState.disabled[id] = true
  }
}

export function resetShortcut(id: ShortcutId) {
  delete shortcutState.disabled[id]
}

export function resetAllShortcuts() {
  shortcutState.disabled = {}
}
