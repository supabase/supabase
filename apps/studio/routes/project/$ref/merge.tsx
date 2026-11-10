import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useParams } from 'common'
import { AlertTriangleIcon, GitBranchIcon, XIcon } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button, cn, NavMenu, NavMenuItem } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'

import { useIsPgDeltaDiffEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import {
  MergeActions,
  MergeSubtitle,
  MergeTitle,
} from '@/components/interfaces/Branching/MergeRequest'
import { DatabaseDiffPanel } from '@/components/interfaces/BranchManagement/DatabaseDiffPanel'
import { EdgeFunctionsDiffPanel } from '@/components/interfaces/BranchManagement/EdgeFunctionsDiffPanel'
import { OutOfDateNotice } from '@/components/interfaces/BranchManagement/OutOfDateNotice'
import { WorkflowLogsCard } from '@/components/interfaces/BranchManagement/WorkflowLogsCard'
import { PageLayout } from '@/components/layouts/PageLayout/PageLayout'
import { ProjectLayoutWithAuth } from '@/components/layouts/ProjectLayout'
import { ScaffoldContainer } from '@/components/layouts/Scaffold'
import ProductEmptyState from '@/components/to-be-cleaned/ProductEmptyState'
import { AlertError } from '@/components/ui/AlertError'
import { InlineLink } from '@/components/ui/InlineLink'
import { NoPermission } from '@/components/ui/NoPermission'
import { useBranchDeleteMutation } from '@/data/branches/branch-delete-mutation'
import { useBranchMergeMutation } from '@/data/branches/branch-merge-mutation'
import { useBranchPushMutation } from '@/data/branches/branch-push-mutation'
import { useBranchUpdateMutation } from '@/data/branches/branch-update-mutation'
import { branchesQueryOptions } from '@/data/branches/branches-query'
import { useProjectGitHubConnectionQuery } from '@/data/integrations/github-connections-query'
import { useProjectDetailQuery } from '@/data/projects/project-detail-query'
import { useBranchGrant } from '@/hooks/branches/useBranchGrant'
import { useBranchMergeDiff } from '@/hooks/branches/useBranchMergeDiff'
import { useWorkflowManagement } from '@/hooks/branches/useWorkflowManagement'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useGrant } from '@/lib/grants'
import { useTrack } from '@/lib/telemetry/track'

export const Route = createFileRoute('/project/$ref/merge')({
  component: ProjectMergeRoute,
})

function ProjectMergeRoute() {
  return (
    <ProjectLayoutWithAuth>
      <MergePage />
    </ProjectLayoutWithAuth>
  )
}

function MergePage() {
  const navigate = useNavigate()
  const { ref } = Route.useParams()
  const { workflow_run_id: currentWorkflowRunId, tab: tabParam } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const pgDeltaDiffEnabled = useIsPgDeltaDiffEnabled()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [workflowFinalStatus, setWorkflowFinalStatus] = useState<'SUCCESS' | 'FAILED' | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const parentProjectRef = project?.parent_project_ref
  const isBranch = parentProjectRef !== undefined

  const { data: parentProject } = useProjectDetailQuery({
    ref: parentProjectRef,
  })
  const { data: ghConnection } = useProjectGitHubConnectionQuery({
    ref: parentProjectRef,
  })

  const branchesGrant = useGrant('GET /v1/projects/{ref}/branches', {
    projectRef: parentProjectRef,
  })

  const { data: branches } = useQuery(
    branchesQueryOptions(
      { projectRef: parentProjectRef, grant: branchesGrant.grant },
      { refetchOnMount: 'always', refetchOnWindowFocus: true, staleTime: 0 }
    )
  )
  const currentBranch = branches?.find((branch) => branch.project_ref === ref)
  const mainBranch = branches?.find((branch) => branch.is_default)

  const updateBranchGrant = useBranchGrant('PATCH /v1/branches/{branch_id_or_ref}', {
    projectRef: parentProjectRef,
    isDefault: currentBranch?.is_default,
  })
  const pushBranchGrant = useBranchGrant('POST /v1/branches/{branch_id_or_ref}/push', {
    projectRef: parentProjectRef,
    isDefault: currentBranch?.is_default,
  })
  const deleteBranchGrant = useBranchGrant('DELETE /v1/branches/{branch_id_or_ref}', {
    projectRef: parentProjectRef,
    isDefault: currentBranch?.is_default,
  })
  const mergeBranchGrant = useBranchGrant('POST /v1/branches/{branch_id_or_ref}/merge', {
    projectRef: parentProjectRef,
    isDefault: currentBranch?.is_default,
  })
  const diffGrant = useBranchGrant('GET /v1/branches/{branch_id_or_ref}/diff', {
    projectRef: parentProjectRef,
    isDefault: currentBranch?.is_default,
  })

  const {
    diffContent,
    isDatabaseDiffLoading,
    isDatabaseDiffRefetching,
    databaseDiffError: diffError,
    refetchDatabaseDiff: refetchDiff,
    edgeFunctionsDiff,
    isBranchOutOfDateMigrations,
    hasEdgeFunctionModifications,
    missingFunctionsCount,
    hasMissingFunctions,
    outOfDateFunctionsCount,
    hasOutOfDateFunctions,
    isBranchOutOfDateOverall,
    missingMigrationsCount,
    modifiedFunctionsCount,
  } = useBranchMergeDiff({
    currentBranchRef: ref,
    isCurrentBranchDefault: currentBranch?.is_default,
    parentProjectRef,
    currentBranchConnectionString: project?.connectionString || undefined,
    parentBranchConnectionString: parentProject?.connectionString || undefined,
    currentBranchCreatedAt: currentBranch?.created_at,
  })

  const { mutate: updateBranch } = useBranchUpdateMutation({
    onError: (error) => {
      toast.error(`Failed to update branch: ${error.message}`)
    },
  })

  const clearDiffsOptimistically = edgeFunctionsDiff.clearDiffsOptimistically

  const handleCurrentBranchWorkflowComplete = useCallback(
    (status: 'SUCCESS' | 'FAILED') => {
      setWorkflowFinalStatus(status)
      refetchDiff()
      clearDiffsOptimistically()
    },
    [refetchDiff, clearDiffsOptimistically]
  )

  const handleParentBranchWorkflowComplete = useCallback(
    (status: 'SUCCESS' | 'FAILED') => {
      setWorkflowFinalStatus(status)
      refetchDiff()
      clearDiffsOptimistically()
      if (
        ref &&
        parentProjectRef &&
        currentBranch?.review_requested_at &&
        updateBranchGrant.status === 'granted'
      ) {
        updateBranch(
          {
            grant: updateBranchGrant.grant,
            branchRef: ref,
            projectRef: parentProjectRef,
            requestReview: false,
          },
          {
            onSuccess: () => toast.success('Branch updated successfully'),
          }
        )
      }
    },
    [
      refetchDiff,
      clearDiffsOptimistically,
      parentProjectRef,
      ref,
      updateBranch,
      updateBranchGrant,
      currentBranch?.review_requested_at,
    ]
  )

  const { run: currentBranchWorkflow, logs: currentBranchLogs } = useWorkflowManagement({
    workflowRunId: currentWorkflowRunId,
    projectRef: ref,
    onWorkflowComplete: handleCurrentBranchWorkflowComplete,
  })

  const { run: parentBranchWorkflow, logs: parentBranchLogs } = useWorkflowManagement({
    workflowRunId: currentWorkflowRunId,
    projectRef: parentProjectRef,
    onWorkflowComplete: handleParentBranchWorkflowComplete,
  })

  const currentWorkflowRun = currentBranchWorkflow || parentBranchWorkflow
  const workflowRunLogs = currentBranchLogs || parentBranchLogs

  const hasCurrentWorkflowFailed = workflowFinalStatus === 'FAILED'
  const hasCurrentWorkflowCompleted = workflowFinalStatus === 'SUCCESS'
  const isWorkflowRunning = currentWorkflowRun?.status === 'RUNNING'

  const addWorkflowRun = useCallback(
    (workflowRunId: string) => {
      void navigate({
        to: '/project/$ref/merge',
        params: { ref },
        search: (prev) => ({ ...prev, workflow_run_id: workflowRunId }),
      })
    },
    [navigate, ref]
  )

  const clearWorkflowRun = useCallback(() => {
    void navigate({
      to: '/project/$ref/merge',
      params: { ref },
      search: (prev) => ({ ...prev, workflow_run_id: undefined }),
    })
  }, [navigate, ref])

  const { mutate: pushBranch, isPending: isPushing } = useBranchPushMutation({
    onSuccess: (data) => {
      toast.success('Branch update initiated!')
      if (data?.workflow_run_id) {
        addWorkflowRun(data.workflow_run_id)
      }

      track('branch_updated', { source: 'merge_page' }, { project: parentProjectRef })
    },
    onError: (error) => {
      toast.error(`Failed to update branch: ${error.message}`)
    },
  })

  const track = useTrack()

  const { mutate: mergeBranch, isPending: isMerging } = useBranchMergeMutation({
    onSuccess: (data) => {
      setIsSubmitting(false)
      if (data.workflowRunId) {
        toast.success('Branch merge initiated!')
        addWorkflowRun(data.workflowRunId)

        track(
          'branch_merge_completed',
          { branchType: currentBranch?.persistent ? 'persistent' : 'preview' },
          { project: parentProjectRef }
        )
      } else {
        toast.info('No changes to merge')
      }
    },
    onError: (error) => {
      setIsSubmitting(false)
      toast.error(`Failed to merge branch: ${error.message}`)

      track(
        'branch_merge_failed',
        {
          branchType: currentBranch?.persistent ? 'persistent' : 'preview',
          error: error.message,
        },
        { project: parentProjectRef }
      )
    },
  })

  const { mutate: deleteBranch, isPending: isDeleting } = useBranchDeleteMutation({
    onSuccess: () => {
      toast.success('Branch closed successfully')
      if (parentProjectRef) {
        void navigate({ to: '/project/$ref/branches', params: { ref: parentProjectRef } })
      }
      track('branch_delete_button_clicked', { origin: 'merge_page' }, { project: parentProjectRef })
    },
    onError: (error) => {
      toast.error(`Failed to close branch: ${error.message}`)
    },
  })

  const handlePush = () => {
    if (!ref || !parentProjectRef || pushBranchGrant.status !== 'granted') return
    pushBranch({
      grant: pushBranchGrant.grant,
      branchRef: ref,
      projectRef: parentProjectRef,
    })
  }

  const handleCloseBranch = () => {
    if (!ref || !parentProjectRef || deleteBranchGrant.status !== 'granted') return
    deleteBranch({
      grant: deleteBranchGrant.grant,
      branchRef: ref,
      projectRef: parentProjectRef,
    })
  }

  const handleMerge = () => {
    if (
      !ref ||
      !parentProjectRef ||
      mergeBranchGrant.status !== 'granted' ||
      diffGrant.status !== 'granted'
    ) {
      return
    }
    setIsSubmitting(true)

    track('branch_merge_submitted', undefined, { project: parentProjectRef })

    mergeBranch({
      grant: mergeBranchGrant.grant,
      diffGrant: diffGrant.grant,
      branchProjectRef: ref,
      baseProjectRef: parentProjectRef,
      migration_version: undefined,
      pgdelta: pgDeltaDiffEnabled,
    })
  }

  const breadcrumbs = useMemo(
    () => [
      {
        label: 'Merge requests',
        href: `/project/${project?.ref}/branches/merge-requests`,
      },
    ],
    [project?.ref]
  )

  const currentTab = tabParam || 'database'

  const navigationItems = useMemo(() => {
    const buildSearch = (tab: string) => {
      const query: Record<string, string> = { tab }
      if (currentWorkflowRunId) query.workflow_run_id = currentWorkflowRunId
      return query
    }

    return [
      {
        label: 'Database',
        search: buildSearch('database'),
        active: currentTab === 'database',
      },
      {
        label: 'Edge Functions',
        search: buildSearch('edge-functions'),
        active: currentTab === 'edge-functions',
      },
    ]
  }, [currentWorkflowRunId, currentTab])

  useEffect(() => {
    setWorkflowFinalStatus(null)
  }, [currentWorkflowRunId])

  if (branchesGrant.status === 'denied') {
    return (
      <PageLayout>
        <ScaffoldContainer size="full">
          <NoPermission resourceText="view this project's branches" />
        </ScaffoldContainer>
      </PageLayout>
    )
  }

  if (branchesGrant.status === 'error') {
    return (
      <PageLayout>
        <ScaffoldContainer size="full">
          <AlertError
            error={branchesGrant.error}
            subject="Failed to check your permissions to view branches"
          />
        </ScaffoldContainer>
      </PageLayout>
    )
  }

  // If not on a preview branch or branch info unavailable, show notice
  if (!isBranch || !currentBranch) {
    return (
      <PageLayout>
        <ScaffoldContainer size="full">
          <div className="flex items-center flex-col justify-center w-full py-16">
            <ProductEmptyState title="Merge Request">
              <p className="text-sm text-foreground-light">
                You can only review changes when on a preview branch
              </p>
            </ProductEmptyState>
          </div>
        </ScaffoldContainer>
      </PageLayout>
    )
  }

  const hasGHProductionDeployEnabled = !!ghConnection && Boolean(mainBranch?.git_branch)

  return (
    <PageLayout
      title={<MergeTitle />}
      subtitle={<MergeSubtitle />}
      breadcrumbs={breadcrumbs}
      primaryActions={
        <MergeActions
          isWorkflowRunning={isWorkflowRunning}
          isSubmitting={isMerging || isSubmitting}
          canMerge={mergeBranchGrant.status === 'granted' && diffGrant.status === 'granted'}
          onSelectMerge={() => setShowConfirmDialog(true)}
        />
      }
      size="full"
      className="h-full border-b-0 pb-0"
    >
      <div className="border-b">
        <ScaffoldContainer size="full">
          {hasGHProductionDeployEnabled ? (
            <Admonition
              type="default"
              title="Branch cannot be merged as deploy to production from GitHub is enabled"
              className="my-4"
            >
              <p className="text-balance">
                Branches should be managed via GitHub to prevent drifts in migrations from your
                repository's state. You may either move your schema changes to a GitHub pull
                request, or disable "Deploy to production" in the{' '}
                <InlineLink href={`/project/${parentProjectRef}/settings/integrations`}>
                  GitHub integration settings
                </InlineLink>
                .
              </p>
            </Admonition>
          ) : isBranchOutOfDateOverall && !currentWorkflowRunId ? (
            <OutOfDateNotice
              isBranchOutOfDateMigrations={isBranchOutOfDateMigrations}
              missingMigrationsCount={missingMigrationsCount}
              hasMissingFunctions={hasMissingFunctions}
              missingFunctionsCount={missingFunctionsCount}
              hasOutOfDateFunctions={hasOutOfDateFunctions}
              outOfDateFunctionsCount={outOfDateFunctionsCount}
              hasEdgeFunctionModifications={hasEdgeFunctionModifications}
              modifiedFunctionsCount={modifiedFunctionsCount}
              isPushing={isPushing}
              canPush={pushBranchGrant.status === 'granted'}
              onPush={handlePush}
            />
          ) : currentWorkflowRunId ? (
            <div className="my-6">
              <WorkflowLogsCard
                workflowRun={currentWorkflowRun}
                logs={workflowRunLogs}
                isLoading={!workflowRunLogs && !!currentWorkflowRunId}
                onClose={clearWorkflowRun}
                overrideTitle={hasCurrentWorkflowFailed ? 'Workflow failed' : undefined}
                overrideDescription={
                  hasCurrentWorkflowFailed
                    ? 'Consider creating a fresh branch from the latest production branch to resolve potential conflicts.'
                    : undefined
                }
                overrideIcon={
                  hasCurrentWorkflowFailed ? (
                    <AlertTriangleIcon
                      size={16}
                      strokeWidth={1.5}
                      className="text-destructive shrink-0"
                    />
                  ) : undefined
                }
                overrideAction={
                  hasCurrentWorkflowFailed ? (
                    <Button
                      asChild
                      icon={<GitBranchIcon size={16} strokeWidth={1.5} />}
                      className="shrink-0"
                    >
                      <Link to="/project/$ref/branches" params={{ ref: parentProjectRef }}>
                        Create new branch
                      </Link>
                    </Button>
                  ) : hasCurrentWorkflowCompleted ? (
                    <Button
                      onClick={handleCloseBranch}
                      disabled={deleteBranchGrant.status !== 'granted'}
                      loading={isDeleting}
                      icon={<XIcon size={16} strokeWidth={1.5} />}
                      className="shrink-0"
                    >
                      Close branch
                    </Button>
                  ) : undefined
                }
              />
            </div>
          ) : null}

          <NavMenu className="mt-4 border-none">
            {navigationItems.map((item) => (
              <NavMenuItem key={item.label} active={item.active}>
                <Link
                  to="/project/$ref/merge"
                  params={{ ref }}
                  search={item.search}
                  className={cn('inline-flex items-center gap-2', item.active && 'text-foreground')}
                >
                  {item.label}
                </Link>
              </NavMenuItem>
            ))}
          </NavMenu>
        </ScaffoldContainer>
      </div>

      <ScaffoldContainer size="full" className="flex min-h-0 flex-1 flex-col pt-6 pb-12">
        <div className="flex min-h-0 flex-1 flex-col">
          {currentTab === 'database' ? (
            <DatabaseDiffPanel
              diffContent={diffContent}
              isLoading={isDatabaseDiffLoading || isDatabaseDiffRefetching}
              error={diffError}
              showRefreshButton={true}
              currentBranchRef={ref}
            />
          ) : (
            <EdgeFunctionsDiffPanel diffResults={edgeFunctionsDiff} currentBranchRef={ref} />
          )}
        </div>
      </ScaffoldContainer>

      <ConfirmationModal
        visible={showConfirmDialog}
        title="Confirm Branch Merge"
        description={`Are you sure you want to merge "${
          currentBranch?.name
        }" into "${mainBranch?.name || 'main'}"? This action cannot be undone.`}
        confirmLabel="Merge branch"
        confirmLabelLoading="Merging..."
        onConfirm={() => {
          setShowConfirmDialog(false)
          handleMerge()
        }}
        onCancel={() => setShowConfirmDialog(false)}
        loading={isMerging || isSubmitting}
      />
    </PageLayout>
  )
}
