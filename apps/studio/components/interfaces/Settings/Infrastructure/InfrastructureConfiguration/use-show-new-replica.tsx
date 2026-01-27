import { parseAsBoolean, useQueryState } from 'nuqs'

export function useShowNewReplicaPanel() {
  const [showNewReplicaPanel, setShowNewReplicaPanel] = useQueryState(
    'createReplica',
    parseAsBoolean.withDefault(false)
  )

  return { showNewReplicaPanel, setShowNewReplicaPanel }
}
