import { useState } from 'react'
import { RefreshCw } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, Button } from 'ui'
import type { EdgeFunctionDeployment } from './types'
import { sortDeployments } from './utils'
import { RollbackModal } from './rollback-modal'
import { useParams } from 'common'
import { EdgeFunctionVersionsLoading } from './loading'
import { EdgeFunctionVersionsError } from './error'
import { useEdgeFunctionDeploymentsQuery } from 'data/edge-functions/edge-function-deployments-query'
import { useEdgeFunctionRollbackMutation } from 'data/edge-functions/edge-function-rollback-mutation'
import { DeployListItem } from './deploy-list-item'

export const EdgeFunctionVersionsList = () => {
  const { ref: projectRef, slug: functionSlug } = useParams()
  const [selectedDeployment, setSelectedDeployment] = useState<EdgeFunctionDeployment | null>(null)
  const [showRollback, setShowRollback] = useState(false)

  // Use hardcoded values for now if params are not available
  const projectId = projectRef || 'demo-project'
  const slug = functionSlug || 'super-function'

  // React Query hooks
  const {
    data: deployments = [],
    isLoading,
    error,
    refetch,
    isFetching: isRefreshing,
  } = useEdgeFunctionDeploymentsQuery({ projectRef: projectId, slug })

  const rollbackMutation = useEdgeFunctionRollbackMutation({
    onSuccess: () => {
      setSelectedDeployment(null)
      setShowRollback(false)
    },
  })

  // Sort deployments and set initial selection
  const sortedDeployments = sortDeployments(deployments)

  // Only show up to the latest 10 deployments (newest first)
  const limitedDeployments = sortedDeployments.slice(0, 10)

  const handleRollbackClick = (deployment: EdgeFunctionDeployment) => {
    setSelectedDeployment(deployment)
    setShowRollback(true)
  }

  const handleRollbackConfirm = async (target?: EdgeFunctionDeployment) => {
    const deployment = target ?? selectedDeployment
    if (!deployment) return

    rollbackMutation.mutate({
      projectRef: projectId,
      slug,
      target_version: deployment.version,
    })
  }

  if (isLoading) return <EdgeFunctionVersionsLoading />

  if (error && !sortedDeployments.length) {
    return <EdgeFunctionVersionsError error={error.message} onRetry={() => refetch()} />
  }

  if (!sortedDeployments.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Deployments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <p className="text-sm text-muted-foreground">No deployments yet</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Deployments</CardTitle>
        <Button
          type="default"
          size="tiny"
          icon={<RefreshCw className={isRefreshing ? 'animate-spin' : ''} />}
          onClick={() => refetch()}
          disabled={isRefreshing}
        >
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-6">
          <p className="text-sm text-foreground-light mb-4">
            Showing up to the latest 10 deployments.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b">
                  <th className="text-left py-2 pr-2">Deployed at</th>
                  <th className="text-left py-2 pr-2">Status</th>
                  <th className="text-left py-2 pr-2">Commit message</th>
                  <th className="text-left py-2 pr-2">Hash</th>
                  <th className="text-left py-2 pr-2">Size</th>
                  <th className="text-right py-2 pl-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {limitedDeployments.map((deployment) => (
                  <DeployListItem
                    key={deployment.id}
                    deployment={deployment}
                    isRestoring={rollbackMutation.isLoading}
                    onRestore={handleRollbackClick}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>

      <RollbackModal
        open={showRollback}
        onOpenChange={setShowRollback}
        deployment={selectedDeployment}
        onConfirm={() => handleRollbackConfirm(selectedDeployment ?? undefined)}
        isLoading={rollbackMutation.isLoading}
      />
    </Card>
  )
}
