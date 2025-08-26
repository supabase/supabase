import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Skeleton } from 'ui'
import { useState, useEffect } from 'react'
import { RefreshCw, AlertCircle } from 'lucide-react'
import { fetchDeployments, fetchVersionCode, rollbackToVersion } from './mocks'
import type { EdgeFunctionDeployment } from './types'
import { RollbackModal } from './rollback-modal'
import { CodeModal } from './code-modal'
import { useParams } from 'common'
import { toast } from 'sonner'

// Ensure newest first: sort by version desc, then created_at desc
const sortDeployments = (items: EdgeFunctionDeployment[]) =>
  items
    .slice()
    .sort((a, b) => (b.version !== a.version ? b.version - a.version : b.created_at - a.created_at))

export const EdgeFunctionVersionsList = () => {
  const { ref: projectRef, slug: functionSlug } = useParams()
  const [deployments, setDeployments] = useState<EdgeFunctionDeployment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isRollingBack, setIsRollingBack] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDeployment, setSelectedDeployment] = useState<EdgeFunctionDeployment | null>(null)
  const [showRollbackModal, setShowRollbackModal] = useState(false)
  const [showCodeModal, setShowCodeModal] = useState(false)
  const [codeFiles, setCodeFiles] = useState<{ path: string; content: string }[]>([])
  const [isLoadingCode, setIsLoadingCode] = useState(false)

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
      setDeployments(sortDeployments(data))
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      if ('active_version' in response) {
        toast.success(`Successfully rolled back to version ${response.active_version}`)
      } else {
        toast.success(
          `Successfully rolled back to version ${selectedDeployment.version} (new version ${response.version} created)`
        )
      }

      setShowRollbackModal(false)
      setSelectedDeployment(null)

      await loadDeployments()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Rollback failed')
    } finally {
      setIsRollingBack(false)
    }
  }

  const handleViewCodeClick = async (deployment: EdgeFunctionDeployment) => {
    try {
      setIsLoadingCode(true)
      setSelectedDeployment(deployment)
      setShowCodeModal(true)

      const projectId = projectRef || 'demo-project'
      const slug = functionSlug || 'super-function'

      const resp = await fetchVersionCode(projectId, slug, deployment.version)
      setCodeFiles(resp.files)
    } finally {
      setIsLoadingCode(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Edge Function Versions</CardTitle>
        </CardHeader>
        <CardContent className="p-0 divide-y">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 flex items-start justify-between">
              <div className="space-y-2 w-full">
                <div className="flex items-center gap-x-3">
                  <Skeleton className="h-4 w-56" />
                </div>
                <Skeleton className="h-4 w-72" />
                <div className="flex items-center gap-x-4">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>

              <div className="flex items-center gap-x-2 shrink-0">
                <Skeleton className="h-7 w-20" />
                <Skeleton className="h-7 w-16" />
              </div>
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
      <CardContent className="p-0 divide-y">
        {deployments.map((deployment) => {
          return (
            <div key={deployment.id} className="p-6 flex items-start justify-between">
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
                  <div className="text-sm text-foreground">{deployment.commit_message}</div>
                )}
                <div className="flex items-center gap-x-4 text-xs text-muted-foreground">
                  {deployment.commit_hash && (
                    <span className="font-mono">#{deployment.commit_hash}</span>
                  )}
                  {typeof deployment.size_kb === 'number' && (
                    <span>{deployment.size_kb.toFixed(1)} KB</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-x-2">
                <Button type="default" size="tiny" onClick={() => handleViewCodeClick(deployment)}>
                  View code
                </Button>
                {deployment.status !== 'ACTIVE' && (
                  <Button
                    type="default"
                    size="tiny"
                    disabled={isRollingBack}
                    onClick={() => handleRollbackClick(deployment)}
                  >
                    Restore
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </CardContent>

      <RollbackModal
        open={showRollbackModal}
        onOpenChange={setShowRollbackModal}
        deployment={selectedDeployment}
        onConfirm={handleRollbackConfirm}
        isLoading={isRollingBack}
      />

      <CodeModal
        open={showCodeModal}
        onOpenChange={setShowCodeModal}
        version={selectedDeployment?.version ?? null}
        files={codeFiles}
        isLoading={isLoadingCode}
      />
    </Card>
  )
}
