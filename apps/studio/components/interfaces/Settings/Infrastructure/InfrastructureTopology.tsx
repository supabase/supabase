import { InstanceConfiguration } from '@/components/interfaces/Settings/Infrastructure/InfrastructureConfiguration/InstanceConfiguration'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'

/** Project topology: load balancer, primary, and read replicas. */
export const InfrastructureTopology = () => {
  const { infrastructureReadReplicas } = useIsFeatureEnabled(['infrastructure:read_replicas'])

  if (!infrastructureReadReplicas) return null

  return (
    <div className="w-full h-[400px] shrink-0 border border-muted rounded-md overflow-hidden relative">
      <InstanceConfiguration />
    </div>
  )
}
