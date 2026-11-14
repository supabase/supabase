import { VectorBucketsLocalDisabledState } from './VectorBucketsLocalDisabledState'
import { AlertError } from '@/components/ui/AlertError'
import { useDeploymentMode } from '@/hooks/misc/useDeploymentMode'
import type { StudioError } from '@/lib/errors/studio-errors'

interface VectorBucketsErrorStateProps {
  error: StudioError | null
}

export const VectorBucketsErrorState = ({ error }: VectorBucketsErrorStateProps) => {
  const { isCli } = useDeploymentMode()

  if (isCli) return <VectorBucketsLocalDisabledState />

  return <AlertError error={error} subject="Failed to retrieve vector buckets" />
}
