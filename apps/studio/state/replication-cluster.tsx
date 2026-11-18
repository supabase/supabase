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

export const useReplicationClusterId = (clusterId?: string) => {
  const selectedClusterId = useContext(ReplicationClusterContext)
  return clusterId ?? selectedClusterId
}
