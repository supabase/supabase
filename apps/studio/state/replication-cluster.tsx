import { createContext, useContext, type PropsWithChildren } from 'react'

const ReplicationClusterContext = createContext<string | undefined>(undefined)

export const ReplicationClusterProvider = ({
  clusterId,
  children,
}: PropsWithChildren<{ clusterId: string | undefined }>) => (
  <ReplicationClusterContext.Provider value={clusterId}>
    {children}
  </ReplicationClusterContext.Provider>
)

export const useReplicationClusterId = (override?: { clusterId?: string }) => {
  const clusterId = useContext(ReplicationClusterContext)
  // An explicit undefined selects the API default from within a cluster scope.
  return override && Object.hasOwn(override, 'clusterId') ? override.clusterId : clusterId
}
