import { parseAsBoolean, useQueryState } from 'nuqs'

/**
 * @deprecated Can remove after read replicas is fully moved into database replication page
 */
export function useShowNewReplicaPanel() {
  const [showNewReplicaPanel, setShowNewReplicaPanel] = useQueryState(
    'createReplica',
    parseAsBoolean.withDefault(false)
  )

  return { showNewReplicaPanel, setShowNewReplicaPanel }
}
