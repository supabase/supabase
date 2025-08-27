import { useState } from 'react'
import { RefreshCw, Eye } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, Button, Badge, LogoLoader, ScrollArea } from 'ui'
import type { EdgeFunctionDeployment } from './types'
import { RollbackModal } from './rollback-modal'
import { useParams } from 'common'
import { EdgeFunctionVersionsLoading } from './loading'
import { EdgeFunctionVersionsError } from './error'
import { useEdgeFunctionDeploymentsQuery } from 'data/edge-functions/edge-function-deployments-query'
import { useEdgeFunctionDeploymentCodeQuery } from 'data/edge-functions/edge-function-deployment-code-query'
import { useEdgeFunctionRollbackMutation } from 'data/edge-functions/edge-function-rollback-mutation'

// Ensure newest first: sort by version desc, then created_at desc
const sortDeployments = (items: EdgeFunctionDeployment[]) =>
  items
    .slice()
    .sort((a, b) => (b.version !== a.version ? b.version - a.version : b.created_at - a.created_at))

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
                <div
                  key={deployment.id}
                  onClick={() => handleViewCodeClick(deployment)}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    isSelected ? 'bg-accent/50 border-primary' : 'hover:bg-accent/30 border-border'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-x-3">
                        <div className="text-foreground font-medium">
                          {new Date(deployment.created_at).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        {deployment.status === 'ACTIVE' && (
                          <Badge variant="default" className="text-xs">
                            Active
                          </Badge>
                        )}
                      </div>
                      {deployment.commit_message && (
                        <div className="text-sm text-foreground-light">
                          {deployment.commit_message}
                        </div>
                      )}
                      <div className="flex items-center gap-x-4 text-xs text-muted-foreground">
                        {deployment.commit_hash && (
                          <span className="font-mono text-foreground-light">
                            #{deployment.commit_hash}
                          </span>
                        )}
                        {typeof deployment.size_kb === 'number' && (
                          <span className="text-foreground-light">
                            {deployment.size_kb.toFixed(1)} KB
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-x-2">
                      <Button
                        type="default"
                        size="tiny"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewCodeClick(deployment)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {deployment.status !== 'ACTIVE' && (
                        <Button
                          type="default"
                          size="tiny"
                          disabled={rollbackMutation.isLoading}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRollbackClick(deployment)
                          }}
                        >
                          Restore
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
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
              ? `Preview of version from ${new Date(selectedDeployment.created_at).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
              : 'Select a version to preview'}
          </p>

          {isLoadingCode ? (
            <div className="flex items-center justify-center h-[400px] rounded border bg-surface-200">
              <LogoLoader />
            </div>
          ) : selectedDeployment && codeFiles.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <div className="text-foreground font-medium">
                    {new Date(selectedDeployment.created_at).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  {selectedDeployment.commit_message && (
                    <div className="text-sm text-foreground-light">
                      {selectedDeployment.commit_message}
                    </div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground text-right">
                  {typeof selectedDeployment.size_kb === 'number' && (
                    <div>{selectedDeployment.size_kb.toFixed(1)} KB</div>
                  )}
                  {selectedDeployment.commit_hash && (
                    <div className="font-mono">#{selectedDeployment.commit_hash}</div>
                  )}
                </div>
              </div>

              <ScrollArea className="h-[400px] rounded border bg-muted p-3 text-xs">
                <pre className="whitespace-pre">
                  <code>{codeFiles[0]?.content ?? ''}</code>
                </pre>
              </ScrollArea>

              {selectedDeployment.status === 'ACTIVE' ? (
                <div className="mt-4 rounded-md bg-accent/30 border p-4 text-sm text-foreground">
                  This is the currently active version
                </div>
              ) : (
                <div className="mt-4">
                  <Button
                    block
                    type="primary"
                    size="medium"
                    disabled={rollbackMutation.isLoading}
                    onClick={() => setShowRollback(true)}
                  >
                    Restore This Version
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground h-[400px] rounded border bg-muted flex items-center justify-center">
              No code available
            </div>
          )}
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
