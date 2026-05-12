import { useParams } from 'common'
import { AlertTriangle, GitBranchIcon, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button, cn, NavMenu, NavMenuItem } from 'ui'
import { Admonition } from 'ui-patterns'
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
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { PageLayout } from '@/components/layouts/PageLayout/PageLayout'
import { ProjectLayoutWithAuth } from '@/components/layouts/ProjectLayout'
import { ScaffoldContainer } from '@/components/layouts/Scaffold'
import ProductEmptyState from '@/components/to-be-cleaned/ProductEmptyState'
import { InlineLink } from '@/components/ui/InlineLink'
import { useBranchDeleteMutation } from '@/data/branches/branch-delete-mutation'
import { useBranchMergeMutation } from '@/data/branches/branch-merge-mutation'
import { useBranchPushMutation } from '@/data/branches/branch-push-mutation'
import { useBranchUpdateMutation } from '@/data/branches/branch-update-mutation'
import { useBranchesQuery } from '@/data/branches/branches-query'
import { useProjectGitHubConnectionQuery } from '@/data/integrations/github-connections-query'
import { useProjectDetailQuery } from '@/data/projects/project-detail-query'
import { useSendEventMutation } from '@/data/telemetry/send-event-mutation'
import { useBranchMergeDiff } from '@/hooks/branches/useBranchMergeDiff'
import { useWorkflowManagement } from '@/hooks/branches/useWorkflowManagement'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import type { NextPageWithLayout } from '@/types'

const MergePage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref, workflow_run_id: currentWorkflowRunId } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: selectedOrg } = useSelectedOrganizationQuery()
  const pgDeltaDiffEnabled = useIsPgDeltaDiffEnabled()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [workflowFinalStatus, setWorkflowFinalStatus] = useState<'SUCCESS' | 'FAILED' | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const isBranch = project?.parent_project_ref !== undefined
  const parentProjectRef = project?.parent_project_ref

  const { data: parentProject } = useProjectDetailQuery({ ref: parentProjectRef })
  const { data: ghConnection } = useProjectGitHubConnectionQuery({ ref: parentProjectRef })

  const { data: branches } = useBranchesQuery(
    { projectRef: parentProjectRef },
    {
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
      staleTime: 0,
    }
  )
  const currentBranch = branches?.find((branch) => branch.project_ref === ref)
  const mainBranch = branches?.find((branch) => branch.is_default)

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
      if (ref && parentProjectRef && currentBranch?.review_requested_at) {
        updateBranch(
          {
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
      router.push({
        pathname: router.pathname,
        query: { ...router.query, workflow_run_id: workflowRunId },
      })
    },
    [router]
  )

  const clearWorkflowRun = useCallback(() => {
    const { workflow_run_id, ...queryWithoutWorkflowId } = router.query
    router.push({
      pathname: router.pathname,
      query: queryWithoutWorkflowId,
    })
  }, [router])

  const { mutate: pushBranch, isPending: isPushing } = useBranchPushMutation({
    onSuccess: (data) => {
      toast.success('Branch update initiated!')
      if (data?.workflow_run_id) {
        addWorkflowRun(data.workflow_run_id)
      }

      // Track branch update
      sendEvent({
        action: 'branch_updated',
        properties: {
          source: 'merge_page',
        },
        groups: {
          project: parentProjectRef ?? 'Unknown',
          organization: selectedOrg?.slug ?? 'Unknown',
        },
      })
    },
    onError: (error) => {
      toast.error(`Failed to update branch: ${error.message}`)
    },
  })

  const { mutate: sendEvent } = useSendEventMutation()

  const { mutate: mergeBranch, isPending: isMerging } = useBranchMergeMutation({
    onSuccess: (data) => {
      setIsSubmitting(false)
      if (data.workflowRunId) {
        toast.success('Branch merge initiated!')
        addWorkflowRun(data.workflowRunId)

        // Track successful merge
        sendEvent({
          action: 'branch_merge_completed',
          properties: {
            branchType: currentBranch?.persistent ? 'persistent' : 'preview',
          },
          groups: {
            project: parentProjectRef ?? 'Unknown',
            organization: selectedOrg?.slug ?? 'Unknown',
          },
        })
      } else {
        toast.info('No changes to merge')
      }
    },
    onError: (error) => {
      setIsSubmitting(false)
      toast.error(`Failed to merge branch: ${error.message}`)

      // Track failed merge
      sendEvent({
        action: 'branch_merge_failed',
        properties: {
          branchType: currentBranch?.persistent ? 'persistent' : 'preview',
          error: error.message,
        },
        groups: {
          project: parentProjectRef ?? 'Unknown',
          organization: selectedOrg?.slug ?? 'Unknown',
        },
      })
    },
  })

  const { mutate: deleteBranch, isPending: isDeleting } = useBranchDeleteMutation({
    onSuccess: () => {
      toast.success('Branch closed successfully')
      router.push(`/project/${parentProjectRef}/branches`)
      // Track delete button click
      sendEvent({
        action: 'branch_delete_button_clicked',
        properties: {
          origin: 'merge_page',
        },
        groups: {
          project: parentProjectRef ?? 'Unknown',
          organization: selectedOrg?.slug ?? 'Unknown',
        },
      })
    },
    onError: (error) => {
      toast.error(`Failed to close branch: ${error.message}`)
    },
  })

  const handlePush = () => {
    if (!ref || !parentProjectRef) return
    pushBranch({
      branchRef: ref,
      projectRef: parentProjectRef,
    })
  }

  const handleCloseBranch = () => {
    if (!ref || !parentProjectRef) return
    deleteBranch({
      branchRef: ref,
      projectRef: parentProjectRef,
    })
  }

  const handleMerge = () => {
    if (!ref || !parentProjectRef) return
    setIsSubmitting(true)

    // Track merge attempt
    sendEvent({
      action: 'branch_merge_submitted',
      groups: {
        project: parentProjectRef ?? 'Unknown',
        organization: selectedOrg?.slug ?? 'Unknown',
      },
    })

    mergeBranch({
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

  const currentTab = (router.query.tab as string) || 'database'

  const navigationItems = useMemo(() => {
    const buildHref = (tab: string) => {
      const query: Record<string, string> = { tab }
      if (currentWorkflowRunId) query.workflow_run_id = currentWorkflowRunId
      const qs = new URLSearchParams(query).toString()
      return `/project/[ref]/merge?${qs}`
    }

    return [
      {
        label: 'Database',
        href: buildHref('database'),
        active: currentTab === 'database',
      },
      {
        label: 'Edge Functions',
        href: buildHref('edge-functions'),
        active: currentTab === 'edge-functions',
      },
    ]
  }, [currentWorkflowRunId, currentTab])

  useEffect(() => {
    setWorkflowFinalStatus(null)
  }, [currentWorkflowRunId])

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
                    <AlertTriangle
                      size={16}
                      strokeWidth={1.5}
                      className="text-destructive shrink-0"
                    />
                  ) : undefined
                }
                overrideAction={
                  hasCurrentWorkflowFailed ? (
                    <Button
                      type="default"
                      asChild
                      icon={<GitBranchIcon size={16} strokeWidth={1.5} />}
                      className="shrink-0"
                    >
                      <Link href={`/project/${parentProjectRef}/branches`}>Create new branch</Link>
                    </Button>
                  ) : hasCurrentWorkflowCompleted ? (
                    <Button
                      type="default"
                      onClick={handleCloseBranch}
                      loading={isDeleting}
                      icon={<X size={16} strokeWidth={1.5} />}
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
            {navigationItems.map((item) => {
              const isActive =
                item.active !== undefined ? item.active : router.asPath.split('?')[0] === item.href
              return (
                <NavMenuItem key={item.label} active={isActive}>
                  <Link
                    href={
                      item.href.includes('[ref]') && !!ref
                        ? item.href.replace('[ref]', ref)
                        : item.href
                    }
                    className={cn('inline-flex items-center gap-2', isActive && 'text-foreground')}
                  >
                    {item.label}
                  </Link>
                </NavMenuItem>
              )
            })}
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
        description={`Are you sure you want to merge "${currentBranch?.name}" into "${mainBranch?.name || 'main'}"? This action cannot be undone.`}
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

MergePage.getLayout = (page) => (
  <DefaultLayout>
    <ProjectLayoutWithAuth>{page}</ProjectLayoutWithAuth>
  </DefaultLayout>
)

export default MergePage
