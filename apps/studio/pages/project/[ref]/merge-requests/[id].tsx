import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'

import { useParams } from 'common'
import { ProjectLayoutWithAuth } from 'components/layouts/ProjectLayout/ProjectLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { useProjectByRef, useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useBranchesQuery } from 'data/branches/branches-query'
import { useBranchMergeMutation } from 'data/branches/branch-merge-mutation'
import { useBranchPushMutation } from 'data/branches/branch-push-mutation'
import { useMergeRequestQuery } from 'data/merge-requests/merge-request-query'
import { useMergeRequestUpdateMutation } from 'data/merge-requests/merge-request-update-mutation'
import { useBranchMergeDiff } from 'hooks/branches/useBranchMergeDiff'
import { useWorkflowManagement } from 'hooks/branches/useWorkflowManagement'
import DatabaseDiffPanel from 'components/interfaces/BranchManagement/DatabaseDiffPanel'
import EdgeFunctionsDiffPanel from 'components/interfaces/BranchManagement/EdgeFunctionsDiffPanel'
import { OutOfDateNotice } from 'components/interfaces/BranchManagement/OutOfDateNotice'
import { Badge, Button, NavMenu, NavMenuItem, cn, Alert } from 'ui'
import { toast } from 'sonner'
import type { NextPageWithLayout } from 'types'

import { ScaffoldContainer } from 'components/layouts/Scaffold'
import {
  GitBranchIcon,
  GitMerge,
  Shield,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react'
import Link from 'next/link'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import WorkflowLogsCard from 'components/interfaces/BranchManagement/WorkflowLogsCard'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import { useFlag } from 'hooks/ui/useFlag'
import ReactMarkdown from 'react-markdown'

const MergeRequestPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref, id } = useParams()

  const gitlessBranching = useFlag('gitlessBranching')

  const project = useSelectedProject()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [workflowFinalStatus, setWorkflowFinalStatus] = useState<string | null>(null)

  const isBranch = project?.parent_project_ref !== undefined
  const parentProjectRef = project?.parent_project_ref || project?.ref

  const parentProject = useProjectByRef(parentProjectRef)

  // Get merge request information
  const {
    data: mergeRequest,
    isLoading: isMergeRequestLoading,
    error: mergeRequestError,
  } = useMergeRequestQuery({
    projectRef: parentProjectRef,
    id,
  })

  // Get branch information for base and head
  const { data: branches } = useBranchesQuery(
    { projectRef: parentProjectRef },
    {
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
      staleTime: 0,
    }
  )

  const headBranch = branches?.find((branch) => branch.id === mergeRequest?.head)
  const baseBranch = branches?.find((branch) => branch.id === mergeRequest?.base)

  // Get the head branch project to use for connection string
  const headBranchProject = useProjectByRef(headBranch?.project_ref)

  // Get combined diff data using head and base branch information
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
    isLoading: isCombinedDiffLoading,
    hasChanges: combinedHasChanges,
  } = useBranchMergeDiff({
    branchId: headBranch?.id,
    currentBranchRef: headBranch?.project_ref,
    parentProjectRef,
    currentBranchConnectionString: (headBranchProject as any)?.connectionString || undefined,
    parentBranchConnectionString: (parentProject as any)?.connectionString || undefined,
    currentBranchCreatedAt: headBranch?.created_at,
  })

  // Get workflow run ID from URL
  const currentWorkflowRunId = router.query.workflow_run_id as string | undefined

  // Reset workflow status when workflow ID changes
  useEffect(() => {
    setWorkflowFinalStatus(null)
  }, [currentWorkflowRunId])

  // Try current branch first, then parent branch
  const { currentWorkflowRun: currentBranchWorkflow, workflowRunLogs: currentBranchLogs } =
    useWorkflowManagement({
      workflowRunId: currentWorkflowRunId,
      projectRef: headBranch?.project_ref,
      onWorkflowComplete: (status) => {
        setWorkflowFinalStatus(status)
        refetchDiff()
        edgeFunctionsDiff.refetchCurrentBranchFunctions()
        edgeFunctionsDiff.refetchMainBranchFunctions()
      },
    })

  const { currentWorkflowRun: parentBranchWorkflow, workflowRunLogs: parentBranchLogs } =
    useWorkflowManagement({
      workflowRunId: currentWorkflowRunId,
      projectRef: parentProjectRef,
      onWorkflowComplete: (status) => {
        setWorkflowFinalStatus(status)
        refetchDiff()
        edgeFunctionsDiff.refetchCurrentBranchFunctions()
        edgeFunctionsDiff.refetchMainBranchFunctions()
      },
    })

  // Use whichever workflow run was found
  const currentWorkflowRun = currentBranchWorkflow || parentBranchWorkflow
  const workflowRunLogs = currentBranchLogs || parentBranchLogs

  // Check if workflow failed based on final status or current status
  const hasCurrentWorkflowFailed = workflowFinalStatus
    ? ['MIGRATIONS_FAILED', 'FUNCTIONS_FAILED'].includes(workflowFinalStatus)
    : currentWorkflowRun?.status &&
      ['MIGRATIONS_FAILED', 'FUNCTIONS_FAILED'].includes(currentWorkflowRun.status)

  // Helper functions for URL management
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

  const { mutate: pushBranch, isLoading: isPushing } = useBranchPushMutation({
    onSuccess: (data) => {
      toast.success('Branch update initiated!')
      // Add workflow run ID to URL for persistence
      if (data?.workflow_run_id) {
        addWorkflowRun(data.workflow_run_id)
      }
    },
    onError: (error) => {
      toast.error(`Failed to update branch: ${error.message}`)
    },
  })

  const { mutate: mergeBranch, isLoading: isMerging } = useBranchMergeMutation({
    onSuccess: (data) => {
      setIsSubmitting(false)
      if (data.hadChanges) {
        if (data.migrationCreated) {
          toast.success('Migration created and branch merge initiated!')
        } else {
          toast.success('Branch merge initiated!')
        }
        // Add workflow run ID to URL for persistence
        if (data.workflowRunId) {
          addWorkflowRun(data.workflowRunId)
        }
      } else {
        toast.info('No changes to merge - branch merged successfully!')
      }
    },
    onError: (error) => {
      setIsSubmitting(false)
      toast.error(`Failed to merge branch: ${error.message}`)
    },
  })

  const { mutate: updateMergeRequest, isLoading: isUpdatingMergeRequest } =
    useMergeRequestUpdateMutation({
      onSuccess: () => {
        toast.success('Merge request approved!')
        // Proceed with actual merge
        handleMerge()
      },
      onError: (error) => {
        toast.error(`Failed to approve merge request: ${error.message}`)
      },
    })

  const handlePush = () => {
    if (!headBranch?.id || !parentProjectRef) return
    pushBranch({
      id: headBranch.id,
      projectRef: parentProjectRef,
    })
  }

  const handleMerge = () => {
    if (!headBranch?.id || !parentProjectRef || !headBranch?.project_ref) return
    setIsSubmitting(true)
    mergeBranch({
      id: headBranch.id,
      branchProjectRef: headBranch.project_ref,
      baseProjectRef: parentProjectRef,
      migration_version: undefined,
    })
  }

  const handleApproveMerge = () => {
    if (!mergeRequest?.id || !parentProjectRef) return
    // TODO: Get current user ID
    updateMergeRequest({
      id: mergeRequest.id,
      projectRef: parentProjectRef,
      merge_approved_by: 'current-user-id', // This should be replaced with actual user ID
    })
  }

  const breadcrumbs = useMemo(
    () => [
      {
        label: 'Branches',
        href: `/project/${parentProjectRef}/branches`,
      },
      {
        label: 'Merge Requests',
        href: `/project/${parentProjectRef}/branches?tab=prs`,
      },
    ],
    [parentProjectRef]
  )

  // Determine current active tab via query param (defaults to 'database')
  const currentTab = (router.query.tab as string) || 'database'

  // Navigation items for PageLayout - updates the `tab` query param
  const navigationItems = useMemo(() => {
    const buildHref = (tab: string) => {
      const query: Record<string, string> = { tab }
      if (currentWorkflowRunId) query.workflow_run_id = currentWorkflowRunId
      const qs = new URLSearchParams(query).toString()
      return `/project/[ref]/merge-requests/[id]?${qs}`
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

  // Show coming soon notice if feature flag is disabled
  if (!gitlessBranching) {
    return (
      <PageLayout>
        <ScaffoldContainer size="full">
          <div className="flex items-center flex-col justify-center w-full py-16">
            <ProductEmptyState title="Merge Requests - Coming Soon">
              <p className="text-sm text-foreground-light">
                The merge requests feature is currently in development and will be available soon.
              </p>
              <div className="flex items-center space-x-2 !mt-4">
                <Button type="default" icon={<ExternalLink strokeWidth={1.5} />} asChild>
                  <a
                    target="_blank"
                    rel="noreferrer"
                    href="https://supabase.com/docs/guides/platform/branching"
                  >
                    View the docs
                  </a>
                </Button>
              </div>
            </ProductEmptyState>
          </div>
        </ScaffoldContainer>
      </PageLayout>
    )
  }

  // Loading state
  if (isMergeRequestLoading) {
    return (
      <PageLayout>
        <ScaffoldContainer size="full">
          <div className="flex items-center justify-center w-full py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto"></div>
              <p className="text-sm text-foreground-light mt-4">Loading merge request...</p>
            </div>
          </div>
        </ScaffoldContainer>
      </PageLayout>
    )
  }

  // Error state
  if (mergeRequestError || !mergeRequest) {
    return (
      <PageLayout>
        <ScaffoldContainer size="full">
          <div className="flex items-center flex-col justify-center w-full py-16">
            <ProductEmptyState title="Merge Request Not Found">
              <p className="text-sm text-foreground-light">
                The merge request you're looking for doesn't exist or has been removed.
              </p>
              <div className="flex items-center space-x-2 !mt-4">
                <Button type="default" asChild>
                  <Link href={`/project/${parentProjectRef}/branches?tab=prs`}>
                    Back to Merge Requests
                  </Link>
                </Button>
              </div>
            </ProductEmptyState>
          </div>
        </ScaffoldContainer>
      </PageLayout>
    )
  }

  const isMergeDisabled =
    !combinedHasChanges ||
    isCombinedDiffLoading ||
    isBranchOutOfDateOverall ||
    !mergeRequest.merge_approved_by

  // Update primary actions - separate approve and merge actions
  const primaryActions = (
    <div className="flex items-end gap-2">
      {!mergeRequest.merge_approved_by && (
        <Button
          type="default"
          loading={isUpdatingMergeRequest}
          onClick={handleApproveMerge}
          icon={<CheckCircle size={16} strokeWidth={1.5} />}
        >
          Approve
        </Button>
      )}
      {isMergeDisabled ? (
        <ButtonTooltip
          tooltip={{
            content: {
              text: !combinedHasChanges ? 'No changes to merge' : 'Branch is out of date',
            },
          }}
          type="primary"
          loading={isMerging || isSubmitting}
          disabled={isMergeDisabled}
          onClick={handleMerge}
          icon={<GitMerge size={16} strokeWidth={1.5} className="text-brand" />}
        >
          Merge
        </ButtonTooltip>
      ) : (
        <Button
          type="primary"
          loading={isMerging || isSubmitting}
          onClick={handleMerge}
          disabled={isBranchOutOfDateOverall}
          icon={<GitMerge size={16} strokeWidth={1.5} className="text-brand" />}
        >
          Merge
        </Button>
      )}
    </div>
  )

  const pageTitle = () => (
    <div className="flex items-center gap-4 flex-wrap">
      <span>{mergeRequest?.title || `${mergeRequest?.head} → ${mergeRequest?.base}`}</span>
    </div>
  )

  const pageSubtitle = () => {
    if (!mergeRequest?.merge_requested_at) return 'Merge request information unavailable'

    const requestedTime = dayjs(mergeRequest.merge_requested_at).fromNow()
    const approvalStatus = mergeRequest.merge_approved_by ? 'Approved' : 'Open'
    return (
      <div className="flex items-center gap-2 mt-2">
        <Badge variant="warning">{approvalStatus}</Badge>
        {mergeRequest.merge_requested_by} requested to merge
        <Link
          href={`/project/${headBranch?.project_ref}/editor`}
          className="text-xs font-mono text-foreground bg-muted px-2 py-1"
        >
          {headBranch?.name || 'head'}
        </Link>
        into
        <Link
          href={`/project/${baseBranch?.project_ref}/editor`}
          className="text-xs font-mono text-foreground bg-warning-200 px-2 py-1"
        >
          {baseBranch?.name || 'base'}
        </Link>
        {requestedTime}
      </div>
    )
  }

  return (
    <PageLayout
      title={pageTitle()}
      subtitle={pageSubtitle()}
      breadcrumbs={breadcrumbs}
      primaryActions={primaryActions}
      size="full"
      className="border-b-0 pb-0"
    >
      <div className="border-b">
        <ScaffoldContainer size="full">
          {/* Show out of date notice or workflow logs */}
          {isBranchOutOfDateOverall && !currentWorkflowRunId ? (
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
                  ) : undefined
                }
              />
            </div>
          ) : null}
          {mergeRequest.description && (
            <ReactMarkdown className="prose text-foreground-light max-w-2xl my-6">
              {mergeRequest.description}
            </ReactMarkdown>
          )}
          {/* Tab navigation */}
          <NavMenu className="mt-4 border-none">
            {navigationItems.map((item) => {
              const isActive =
                item.active !== undefined ? item.active : router.asPath.split('?')[0] === item.href
              return (
                <NavMenuItem key={item.label} active={isActive}>
                  <Link
                    href={
                      item.href.includes('[ref]') && !!ref
                        ? item.href.replace('[ref]', ref).replace('[id]', id as string)
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
      <ScaffoldContainer size="full" className="pt-6 pb-12">
        {/* Content based on selected tab */}
        {currentTab === 'database' ? (
          <DatabaseDiffPanel
            diffContent={diffContent}
            isLoading={isDatabaseDiffLoading || isDatabaseDiffRefetching}
            error={diffError}
            showRefreshButton={true}
            currentBranchRef={headBranch?.project_ref}
          />
        ) : (
          <EdgeFunctionsDiffPanel
            diffResults={edgeFunctionsDiff}
            currentBranchRef={headBranch?.project_ref}
            mainBranchRef={parentProjectRef}
          />
        )}
      </ScaffoldContainer>
    </PageLayout>
  )
}

MergeRequestPage.getLayout = (page) => (
  <DefaultLayout>
    <ProjectLayoutWithAuth>{page}</ProjectLayoutWithAuth>
  </DefaultLayout>
)

export default MergeRequestPage
