import { useState } from 'react'
import { RefreshCw, Eye } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, Button } from 'ui'
import type { EdgeFunctionDeployment } from './types'
import { sortDeployments, formatDateTime } from './utils'
import { VersionListItem } from './version-list-item'
import { VersionCodePreview } from './version-code-preview'
import { RollbackModal } from './rollback-modal'
import { useParams } from 'common'
import { EdgeFunctionVersionsLoading } from './loading'
import { EdgeFunctionVersionsError } from './error'
import { useEdgeFunctionDeploymentsQuery } from 'data/edge-functions/edge-function-deployments-query'
import { useEdgeFunctionDeploymentCodeQuery } from 'data/edge-functions/edge-function-deployment-code-query'
import { useEdgeFunctionRollbackMutation } from 'data/edge-functions/edge-function-rollback-mutation'

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

  const { data: codeResponse, isLoading: isLoadingCode } = useEdgeFunctionDeploymentCodeQuery(
    {
      projectRef: projectId,
      slug,
      version: selectedDeployment?.version,
    },
    {
      enabled: !!selectedDeployment,
    }
  )

  const rollbackMutation = useEdgeFunctionRollbackMutation({
    onSuccess: () => {
      setSelectedDeployment(null)
      setShowRollback(false)
    },
  })

  // Sort deployments and set initial selection
  const sortedDeployments = sortDeployments(deployments)

  // Set default selected deployment when deployments load
  if (sortedDeployments.length > 0 && !selectedDeployment) {
    const defaultSelected =
      sortedDeployments.find((d) => d.status === 'ACTIVE') || sortedDeployments[0]
    setSelectedDeployment(defaultSelected)
  }

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

  const handleViewCodeClick = (deployment: EdgeFunctionDeployment) => {
    setSelectedDeployment(deployment)
  }

  // Get code files from the response
  const codeFiles = codeResponse?.files || []

  if (isLoading) return <EdgeFunctionVersionsLoading />

  if (error && !sortedDeployments.length) {
    return <EdgeFunctionVersionsError error={error.message} onRetry={() => refetch()} />
  }

  if (!sortedDeployments.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Edge Function Versions</CardTitle>
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
        <CardTitle>Edge Function Versions</CardTitle>
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
      <CardContent className="p-0 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="h-4 w-4" />
            <h4 className="text-foreground">Available Versions</h4>
          </div>
          <p className="text-sm text-foreground-light mb-4">
            Select a version to preview its content and restore if needed.
          </p>
          <div className="space-y-3">
            {sortedDeployments.map((deployment) => {
              const isSelected = selectedDeployment?.id === deployment.id

              return (
                <VersionListItem
                  key={deployment.id}
                  deployment={deployment}
                  isSelected={isSelected}
                  isRestoring={rollbackMutation.isLoading}
                  onPreview={handleViewCodeClick}
                  onRestore={handleRollbackClick}
                />
              )
            })}
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="h-4 w-4" />
            <h4 className="text-foreground">Version Preview</h4>
          </div>
          <p className="text-sm text-foreground-light mb-4">
            {selectedDeployment
              ? `Preview of version from ${formatDateTime(selectedDeployment.created_at)}`
              : 'Select a version to preview'}
          </p>

          <VersionCodePreview
            selectedDeployment={selectedDeployment}
            codeFiles={codeFiles}
            isLoading={isLoadingCode}
            isRestoring={rollbackMutation.isLoading}
            onOpenRollback={() => setShowRollback(true)}
          />
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
