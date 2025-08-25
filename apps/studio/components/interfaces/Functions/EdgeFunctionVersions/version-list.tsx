import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Skeleton } from 'ui'
import { useState, useEffect } from 'react'
import { RefreshCw, AlertCircle } from 'lucide-react'
import { fetchDeployments, rollbackToVersion } from './mocks'
import type { EdgeFunctionDeployment } from './types'
import { RollbackModal } from './RollbackModal'
import { useParams } from 'common'
import { toast } from 'sonner'

export const EdgeFunctionVersionsList = () => {
  const { ref: projectRef, slug: functionSlug } = useParams()
  const [deployments, setDeployments] = useState<EdgeFunctionDeployment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isRollingBack, setIsRollingBack] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDeployment, setSelectedDeployment] = useState<EdgeFunctionDeployment | null>(null)
  const [showRollbackModal, setShowRollbackModal] = useState(false)

  // Load deployments on mount and when dependencies change
  const loadDeployments = async (showRefreshState = false) => {
    try {
      if (showRefreshState) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }
      setError(null)

      // Use hardcoded values for now if params are not available
      const projectId = projectRef || 'demo-project'
      const slug = functionSlug || 'super-function'

      const data = await fetchDeployments(projectId, slug)
      setDeployments(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load deployments')
      toast.error('Failed to load deployments')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadDeployments()
  }, [projectRef, functionSlug])

  const handleRollbackClick = (deployment: EdgeFunctionDeployment) => {
    setSelectedDeployment(deployment)
    setShowRollbackModal(true)
  }

  const handleRollbackConfirm = async () => {
    if (!selectedDeployment) return

    try {
      setIsRollingBack(true)

      const projectId = projectRef || 'demo-project'
      const slug = functionSlug || 'super-function'

      const response = await rollbackToVersion(projectId, slug, selectedDeployment.version)

      // Show success message based on response type
      if ('active_version' in response) {
        toast.success(`Successfully rolled back to version ${response.active_version}`)
      } else {
        toast.success(
          `Successfully rolled back to version ${selectedDeployment.version} (new version ${response.version} created)`
        )
      }

      setShowRollbackModal(false)
      setSelectedDeployment(null)

      // Reload deployments to show updated state
      await loadDeployments()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Rollback failed')
    } finally {
      setIsRollingBack(false)
    }
  }

  const formatTimestamp = (epochMs: number) => {
    const date = new Date(epochMs)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    // Relative time
    let relative = ''
    if (diffMins < 1) {
      relative = 'just now'
    } else if (diffMins < 60) {
      relative = `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`
    } else if (diffHours < 24) {
      relative = `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
    } else if (diffDays < 30) {
      relative = `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
    } else {
      relative = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      })
    }

    const absolute = date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })

    return { relative, absolute }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Edge Function Versions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (error && !deployments.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Edge Function Versions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button onClick={() => loadDeployments()}>Retry</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!deployments.length) {
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
          onClick={() => loadDeployments(true)}
          disabled={isRefreshing}
        >
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left font-medium p-4">Version</th>
                <th className="text-left font-medium p-4">Status</th>
                <th className="text-left font-medium p-4">Deployed at</th>
                <th className="text-left font-medium p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {deployments.map((deployment) => {
                const { relative, absolute } = formatTimestamp(deployment.created_at)
                return (
                  <tr key={deployment.id} className="border-b hover:bg-muted/50">
                    <td className="p-4">
                      <span className="font-mono">{deployment.version}</span>
                    </td>
                    <td className="p-4">
                      {deployment.status === 'ACTIVE' ? (
                        <Badge variant="default" className="bg-green-500">
                          ACTIVE
                        </Badge>
                      ) : (
                        <Badge variant="secondary">INACTIVE</Badge>
                      )}
                    </td>
                    <td className="p-4">
                      <div>
                        <div className="text-foreground">{relative}</div>
                        <div className="text-xs text-muted-foreground">{absolute}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      {deployment.status !== 'ACTIVE' && (
                        <Button
                          type="default"
                          size="tiny"
                          disabled={isRollingBack}
                          onClick={() => handleRollbackClick(deployment)}
                        >
                          Roll back
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>

      <RollbackModal
        open={showRollbackModal}
        onOpenChange={setShowRollbackModal}
        deployment={selectedDeployment}
        onConfirm={handleRollbackConfirm}
        isLoading={isRollingBack}
      />
    </Card>
  )
}
