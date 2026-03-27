'use client'

import { parseAsBoolean, parseAsString, useQueryState } from 'nuqs'

export function useEntityPanelParams() {
  const [isCreating, setIsCreating] = useQueryState(
    'new',
    parseAsBoolean.withDefault(false).withOptions({ history: 'push', clearOnDefault: true })
  )
  const [editingId, setEditingId] = useQueryState(
    'edit',
    parseAsString.withOptions({ history: 'push', clearOnDefault: true })
  )
  const [duplicatingId, setDuplicatingId] = useQueryState(
    'duplicate',
    parseAsString.withOptions({ history: 'push', clearOnDefault: true })
  )

  const closePanels = () => {
    setIsCreating(false)
    setEditingId(null)
    setDuplicatingId(null)
  }

  return {
    isCreating,
    setIsCreating,
    editingId,
    setEditingId,
    duplicatingId,
    setDuplicatingId,
    closePanels,
  }
}
