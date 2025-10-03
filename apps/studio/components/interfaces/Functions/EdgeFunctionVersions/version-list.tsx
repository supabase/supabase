import { useState } from 'react'

import { Card, Table, TableHeader, TableHead, TableBody, TableRow } from 'ui'
import type { EdgeFunctionDeployment } from './types'
import { sortDeployments } from './utils'
import { RollbackModal } from './rollback-modal'
import { useParams } from 'common'
import { useEdgeFunctionDeploymentsQuery } from 'data/edge-functions/edge-function-deployments-query'
import { useEdgeFunctionRollbackMutation } from 'data/edge-functions/edge-function-rollback-mutation'
import { DeployListItem } from './deploy-list-item'
import { GenericSkeletonLoader } from 'ui-patterns'
import AlertError from 'components/ui/AlertError'
import { FunctionsEmptyState } from '../FunctionsEmptyState'

export const EdgeFunctionVersionsList = () => {
  const { ref: projectRef, slug: functionSlug } = useParams()
  const [selectedDeployment, setSelectedDeployment] = useState<EdgeFunctionDeployment | null>(null)
  const [showRollback, setShowRollback] = useState(false)

  // Use hardcoded values for now if params are not available
  const projectId = projectRef || 'demo-project'
  const slug = functionSlug || 'super-function'

  const {
    data: deployments = [],
    isLoading,
    error,
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

  if (isLoading) return <GenericSkeletonLoader />
  if (error)
    return <AlertError error={error} subject="Failed to retrieve edge function deployments" />

  if (sortedDeployments.length === 0) return <FunctionsEmptyState />

  return (
    <>
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
    </>
  )
}
