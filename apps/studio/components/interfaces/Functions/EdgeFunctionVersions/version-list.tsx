import { useState } from 'react'
import { RefreshCw } from 'lucide-react'

import { Card, CardContent, Table, TableHeader, TableHead, TableBody, TableRow, Button } from 'ui'
import type { EdgeFunctionDeployment } from './types'
import { sortDeployments } from './utils'
import { RollbackModal } from './rollback-modal'
import { useParams } from 'common'
import { EdgeFunctionVersionsLoading } from './loading'
import { EdgeFunctionVersionsError } from './error'
import { useEdgeFunctionDeploymentsQuery } from 'data/edge-functions/edge-function-deployments-query'
import { useEdgeFunctionRollbackMutation } from 'data/edge-functions/edge-function-rollback-mutation'
import { DeployListItem } from './deploy-list-item'
import {
  ScaffoldContainer,
  ScaffoldHeader,
  ScaffoldSection,
  ScaffoldSectionTitle,
} from 'components/layouts/Scaffold'

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
      <ScaffoldContainer className="max-w-full px-0 @lg:px-0 @xl:px-0">
        <ScaffoldHeader className="py-0 flex flex-row items-center justify-between">
          <ScaffoldSectionTitle className="mb-0">Deployments</ScaffoldSectionTitle>
          <Button
            type="default"
            size="tiny"
            icon={<RefreshCw className={isRefreshing ? 'animate-spin' : ''} />}
            onClick={() => refetch()}
            disabled={isRefreshing}
            aria-label="Refresh deployments"
          >
            Refresh
          </Button>
        </ScaffoldHeader>
        <ScaffoldSection>
          <div className="col-span-12">
            <Card>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <p className="text-sm text-muted-foreground">No deployments yet</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScaffoldSection>
      </ScaffoldContainer>
    )
  }

  return (
    <ScaffoldContainer className="max-w-full px-0 @lg:px-0 @xl:px-0">
      <ScaffoldHeader className="py-0 flex flex-row items-center justify-between">
        <ScaffoldSectionTitle>Deployments</ScaffoldSectionTitle>
        <Button
          type="default"
          size="tiny"
          icon={<RefreshCw className={isRefreshing ? 'animate-spin' : ''} />}
          onClick={() => refetch()}
          disabled={isRefreshing}
          aria-label="Refresh deployments"
        >
          Refresh
        </Button>
      </ScaffoldHeader>
      <ScaffoldSection className="pt-4">
        <div className="col-span-12">
          <Card>
            <Table className="overflow-x-auto">
              <TableHeader>
                <TableRow>
                  <TableHead>Deployed at</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Commit message</TableHead>
                  <TableHead>Hash</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead className="w-0 text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {limitedDeployments.map((deployment) => (
                  <DeployListItem
                    key={deployment.id}
                    deployment={deployment}
                    isRestoring={rollbackMutation.isLoading}
                    onRestore={handleRollbackClick}
                  />
                ))}
              </TableBody>
            </Table>
          </Card>

          <RollbackModal
            open={showRollback}
            onOpenChange={setShowRollback}
            deployment={selectedDeployment}
            onConfirm={() => handleRollbackConfirm(selectedDeployment ?? undefined)}
            isLoading={rollbackMutation.isLoading}
          />
        </div>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}
