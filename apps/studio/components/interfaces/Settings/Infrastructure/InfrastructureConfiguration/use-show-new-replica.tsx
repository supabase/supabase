import { useQueryState, parseAsBoolean } from 'nuqs'

export function useShowNewReplicaPanel() {
  const [showNewReplicaPanel, setShowNewReplicaPanel] = useQueryState(
    'createReplica',
    parseAsBoolean.withDefault(false)
  )

  return { showNewReplicaPanel, setShowNewReplicaPanel }
}
