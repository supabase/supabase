import { useEffect, useRef } from 'react'

import { registerPanelBackGuard } from '@/lib/panel-history'

/**
 * While `active` and dirty, browser Back keeps the panel open and runs
 * `onBlock` (the unsaved-changes confirm).
 *
 * One guard object is published for the life of the component. Later renders
 * write `active` onto it, so the listener sees the open panel even when the
 * effect does not re-run.
 */
export function usePanelBackGuard({
  active,
  isDirty,
  onBlock,
}: {
  active: boolean
  isDirty: () => boolean
  onBlock: () => void
}) {
  const state = useRef<{
    active: boolean
    isDirty: () => boolean
    onBlock: () => void
  } | null>(null)

  if (!state.current) {
    state.current = { active, isDirty, onBlock }
  }

  state.current.active = active
  state.current.isDirty = isDirty
  state.current.onBlock = onBlock

  useEffect(() => {
    const current = state.current

    if (!current) return

    return registerPanelBackGuard({
      shouldBlock: () => current.active && current.isDirty(),
      onBlock: () => current.onBlock(),
    })
  }, [])
}
