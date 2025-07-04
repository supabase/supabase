import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/router'
import dayjs from 'dayjs'

import { useParams } from 'common'
import { ProjectLayoutWithAuth } from 'components/layouts/ProjectLayout/ProjectLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { useProjectByRef, useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useBranchesQuery } from 'data/branches/branches-query'
import { useBranchMergeMutation } from 'data/branches/branch-merge-mutation'
import { useBranchPushMutation } from 'data/branches/branch-push-mutation'
import { useBranchMergeDiff } from 'hooks/branches/useBranchMergeDiff'
import { useWorkflowManagement } from 'hooks/branches/useWorkflowManagement'
import DatabaseDiffPanel from 'components/interfaces/BranchManagement/DatabaseDiffPanel'
import EdgeFunctionsDiffPanel from 'components/interfaces/BranchManagement/EdgeFunctionsDiffPanel'
import { OutOfDateNotice } from 'components/interfaces/BranchManagement/OutOfDateNotice'
import { Badge, Button, NavMenu, NavMenuItem, cn, Alert } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { toast } from 'sonner'
import type { NextPageWithLayout } from 'types'

import { ScaffoldContainer } from 'components/layouts/Scaffold'
import { GitBranchIcon, GitMerge, Shield, ExternalLink, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import WorkflowLogsCard from 'components/interfaces/BranchManagement/WorkflowLogsCard'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import { useFlag } from 'hooks/ui/useFlag'

const MergePage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = useParams()

  const gitlessBranching = useFlag('gitlessBranching')

  const project = useSelectedProject()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [workflowFinalStatus, setWorkflowFinalStatus] = useState<string | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const isBranch = project?.parent_project_ref !== undefined
  const parentProjectRef = project?.parent_project_ref

  const parentProject = useProjectByRef(parentProjectRef)

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
    isLoading: isCombinedDiffLoading,
    hasChanges: combinedHasChanges,
  } = useBranchMergeDiff({
    branchId: currentBranch?.id,
    currentBranchRef: ref,
    parentProjectRef,
    currentBranchConnectionString: project?.connectionString || undefined,
    parentBranchConnectionString: (parentProject as any)?.connectionString || undefined,
    currentBranchCreatedAt: currentBranch?.created_at,
  })

  const currentWorkflowRunId = router.query.workflow_run_id as string | undefined

  useEffect(() => {
    setWorkflowFinalStatus(null)
  }, [currentWorkflowRunId])

  const { currentWorkflowRun: currentBranchWorkflow, workflowRunLogs: currentBranchLogs } =
    useWorkflowManagement({
      workflowRunId: currentWorkflowRunId,
      projectRef: ref,
      onWorkflowComplete: (status) => {
        setWorkflowFinalStatus(status)
        refetchDiff()
        edgeFunctionsDiff.clearDiffsOptimistically()
      },
    })

  const { currentWorkflowRun: parentBranchWorkflow, workflowRunLogs: parentBranchLogs } =
    useWorkflowManagement({
      workflowRunId: currentWorkflowRunId,
      projectRef: parentProjectRef,
      onWorkflowComplete: (status) => {
        setWorkflowFinalStatus(status)
        refetchDiff()
        edgeFunctionsDiff.clearDiffsOptimistically()
      },
    })

  const currentWorkflowRun = currentBranchWorkflow || parentBranchWorkflow
  const workflowRunLogs = currentBranchLogs || parentBranchLogs

  const hasCurrentWorkflowFailed = workflowFinalStatus
    ? ['MIGRATIONS_FAILED', 'FUNCTIONS_FAILED'].includes(workflowFinalStatus)
    : currentWorkflowRun?.status &&
      ['MIGRATIONS_FAILED', 'FUNCTIONS_FAILED'].includes(currentWorkflowRun.status)

  const isWorkflowRunning =
    currentWorkflowRun?.status === 'RUNNING_MIGRATIONS' ||
    currentWorkflowRun?.status === 'CREATING_PROJECT'

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
      if (data.workflowRunId) {
        toast.success('Branch merge initiated!')
        addWorkflowRun(data.workflowRunId)
      } else {
        toast.info('No changes to merge')
      }
    },
    onError: (error) => {
      setIsSubmitting(false)
      toast.error(`Failed to merge branch: ${error.message}`)
    },
  })

  const handlePush = () => {
    if (!currentBranch?.id || !parentProjectRef) return
    pushBranch({
      id: currentBranch.id,
      projectRef: parentProjectRef,
    })
  }

  const handleMerge = () => {
    if (!currentBranch?.id || !parentProjectRef || !ref) return
    setIsSubmitting(true)
    mergeBranch({
      id: currentBranch.id,
      branchProjectRef: ref,
      baseProjectRef: parentProjectRef,
      migration_version: undefined,
    })
  }

  const handleShowConfirmDialog = () => {
    setShowConfirmDialog(true)
  }

  const handleConfirmMerge = () => {
    setShowConfirmDialog(false)
    handleMerge()
  }

  const handleCancelMerge = () => {
    setShowConfirmDialog(false)
  }

  const breadcrumbs = useMemo(
    () => [
      {
        label: 'Branches',
        href: `/project/${parentProjectRef}/branches`,
      },
    ],
    [parentProjectRef]
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

  if (!gitlessBranching) {
    return (
      <PageLayout>
        <ScaffoldContainer size="full">
          <div className="flex items-center flex-col justify-center w-full py-16">
            <ProductEmptyState title="Branch Merge - Coming Soon">
              <p className="text-sm text-foreground-light">
                The branch merge feature is currently in development and will be available soon.
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

  // If not on a preview branch or branch info unavailable, show notice
  if (!isBranch || !currentBranch) {
    return (
      <PageLayout>
        <ScaffoldContainer size="full">
          <div className="flex items-center flex-col justify-center w-full py-16">
            <ProductEmptyState title="Merge Request">
              <p className="text-sm text-foreground-light">
                This page is only available for preview branches.
              </p>
            </ProductEmptyState>
          </div>
        </ScaffoldContainer>
      </PageLayout>
    )
  }

  const isMergeDisabled =
    !combinedHasChanges || isCombinedDiffLoading || isBranchOutOfDateOverall || isWorkflowRunning

  // Update primary actions - remove push button if branch is out of date (it will be in the notice)
  const primaryActions = (
    <div className="flex items-end gap-2">
      {isMergeDisabled ? (
        <ButtonTooltip
          tooltip={{
            content: {
              text: !combinedHasChanges
                ? 'No changes to merge'
                : isWorkflowRunning
                  ? 'Workflow is currently running'
                  : 'Branch is out of date',
            },
          }}
          type="primary"
          loading={isMerging || isSubmitting}
          disabled={isMergeDisabled}
          onClick={handleShowConfirmDialog}
          icon={<GitMerge size={16} strokeWidth={1.5} className="text-brand" />}
        >
          Merge branch
        </ButtonTooltip>
      ) : (
        <Button
          type="primary"
          loading={isMerging || isSubmitting}
          onClick={handleShowConfirmDialog}
          disabled={isBranchOutOfDateOverall}
          icon={<GitMerge size={16} strokeWidth={1.5} className="text-brand" />}
        >
          Merge branch
        </Button>
      )}
    </div>
  )

  const pageTitle = () => (
    <span>
      Merge{' '}
      <Link href={`/project/${ref}/editor`}>
        <Badge className="font-mono text-lg gap-1">
          <GitBranchIcon strokeWidth={1.5} size={16} className="text-foreground-muted" />
          {currentBranch.name}
        </Badge>
      </Link>{' '}
      into{' '}
      <Link
        href={`/project/${mainBranch?.project_ref}/editor`}
        className="font-mono inline-flex gap-4"
      >
        <Badge className="font-mono text-lg gap-1">
          <Shield strokeWidth={1.5} size={16} className="text-warning" />
          {mainBranch?.name || 'main'}
        </Badge>
      </Link>
    </span>
  )

  const pageSubtitle = () => {
    if (!currentBranch?.created_at) return 'Branch information unavailable'

    const createdTime = dayjs(currentBranch.created_at).fromNow()
    return `Branch created ${createdTime}`
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
      <ScaffoldContainer size="full" className="pt-6 pb-12">
        {currentTab === 'database' ? (
          <DatabaseDiffPanel
            diffContent={diffContent}
            isLoading={isDatabaseDiffLoading || isDatabaseDiffRefetching}
            error={diffError}
            showRefreshButton={true}
            currentBranchRef={ref}
          />
        ) : (
          <EdgeFunctionsDiffPanel
            diffResults={edgeFunctionsDiff}
            currentBranchRef={ref}
            mainBranchRef={parentProjectRef}
          />
        )}
      </ScaffoldContainer>

      <ConfirmationModal
        visible={showConfirmDialog}
        title="Confirm Branch Merge"
        description={`Are you sure you want to merge "${currentBranch?.name}" into "${mainBranch?.name || 'main'}"? This action cannot be undone.`}
        confirmLabel="Merge Branch"
        confirmLabelLoading="Merging..."
        onConfirm={handleConfirmMerge}
        onCancel={handleCancelMerge}
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
