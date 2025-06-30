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
import { useBranchMergeDiff } from 'hooks/misc/useBranchMergeDiff'
import DatabaseDiffPanel from 'components/interfaces/BranchManagement/DatabaseDiffPanel'
import EdgeFunctionsDiffPanel from 'components/interfaces/BranchManagement/EdgeFunctionsDiffPanel'
import { OutOfDateNotice } from 'components/interfaces/BranchManagement/OutOfDateNotice'
import { Badge, Button, NavMenu, NavMenuItem, cn, Alert } from 'ui'
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

  // State to track related workflow runs with their project refs
  const [relatedWorkflowRunIds, setRelatedWorkflowRunIds] = useState<Record<string, string>>({})

  // State to track failed workflows
  const [failedWorkflowIds, setFailedWorkflowIds] = useState<Set<string>>(new Set())

  const isBranch = project?.parent_project_ref !== undefined
  const parentProjectRef = project?.parent_project_ref

  const parentProject = useProjectByRef(parentProjectRef)

  // Get branch information
  const { data: branches } = useBranchesQuery(
    { projectRef: parentProjectRef },
    {
      enabled: !!parentProjectRef,
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
      staleTime: 0,
    }
  )
  const currentBranch = branches?.find((branch) => branch.project_ref === ref)
  const mainBranch = branches?.find((branch) => branch.is_default)

  // Get workflow run ID from URL query parameter and initialize state
  useEffect(() => {
    const workflowRunId = router.query.workflow_run_id as string | undefined
    if (workflowRunId && !relatedWorkflowRunIds[workflowRunId]) {
      // Default to current branch project ref if not specified
      setRelatedWorkflowRunIds((prev) => ({
        ...prev,
        [workflowRunId]: ref || '',
      }))
    }
  }, [router.query.workflow_run_id, ref, relatedWorkflowRunIds])

  // Get combined diff data (database, edge functions, migrations, and branch state)
  const {
    diffContent,
    isDatabaseDiffLoading,
    isDatabaseDiffRefetching,
    databaseDiffError: diffError,
    refetchDatabaseDiff: refetchDiff,
    edgeFunctionsDiff,
    isBranchOutOfDateMigrations,
    hasEdgeFunctionModifications,
    newerRemovedFunctionsCount,
    hasNewerRemovedFunctions,
    newerModifiedFunctionsCount,
    hasNewerModifiedFunctions,
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

  // Handle workflow completion - refetch diff once when workflow completes or fails
  const handleWorkflowStatusChange = useCallback(
    (status: string, workflowRunId: string) => {
      const isComplete =
        status === 'FUNCTIONS_DEPLOYED' ||
        status === 'MIGRATIONS_FAILED' ||
        status === 'FUNCTIONS_FAILED'

      const isFailed = status === 'MIGRATIONS_FAILED' || status === 'FUNCTIONS_FAILED'

      if (isFailed) {
        setFailedWorkflowIds((prev) => new Set(prev).add(workflowRunId))
      }

      if (isComplete) {
        // Refetch diff and edge functions once when workflow completes
        refetchDiff()
        edgeFunctionsDiff.refetchCurrentBranchFunctions()
        edgeFunctionsDiff.refetchMainBranchFunctions()
      }
    },
    [refetchDiff, edgeFunctionsDiff]
  )

  const { mutate: pushBranch, isLoading: isPushing } = useBranchPushMutation({
    onSuccess: (data) => {
      toast.success('Branch update initiated!')
      // Add workflow run ID to URL for persistence and track it (push workflows run on current branch)
      if (data?.workflow_run_id) {
        setRelatedWorkflowRunIds((prev) => ({
          ...prev,
          [data.workflow_run_id]: ref || '',
        }))
        router.push({
          pathname: router.pathname,
          query: { ...router.query, workflow_run_id: data.workflow_run_id },
        })
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
        // Add workflow run ID to URL for persistence and track it (merge workflows run on parent branch)
        if (data.workflowRunId) {
          setRelatedWorkflowRunIds((prev) => ({
            ...prev,
            [data.workflowRunId]: parentProjectRef || '',
          }))
          router.push({
            pathname: router.pathname,
            query: { ...router.query, workflow_run_id: data.workflowRunId },
          })
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

  const breadcrumbs = useMemo(
    () => [
      {
        label: 'Branches',
        href: `/project/${parentProjectRef}/branches`,
      },
    ],
    [parentProjectRef]
  )

  // Determine current active tab via query param (defaults to 'database')
  const currentTab = (router.query.tab as string) || 'database'

  // Get the current workflow run ID from URL
  const currentWorkflowRunId = router.query.workflow_run_id as string | undefined

  // Check if current workflow run has failed
  const hasCurrentWorkflowFailed =
    currentWorkflowRunId && failedWorkflowIds.has(currentWorkflowRunId)

  // Navigation items for PageLayout - updates the `tab` query param
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

  // Show coming soon notice if feature flag is disabled
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
      <PageLayout title="Merge Request">
        <div className="p-6">
          <p>This page is only available for preview branches.</p>
        </div>
      </PageLayout>
    )
  }

  const isDataLoaded = !isCombinedDiffLoading
  const isMergeDisabled = combinedHasChanges && isDataLoaded

  // Update primary actions - remove push button if branch is out of date (it will be in the notice)
  const primaryActions = (
    <div className="flex items-end gap-2">
      {isMergeDisabled ? (
        <ButtonTooltip
          tooltip={{
            content: {
              text: 'No changes to merge',
            },
          }}
          type="primary"
          loading={isMerging || isSubmitting}
          disabled={isMergeDisabled}
          onClick={handleMerge}
          icon={<GitMerge size={16} strokeWidth={1.5} className="text-brand" />}
        >
          Merge branch
        </ButtonTooltip>
      ) : (
        <Button
          type="primary"
          loading={isMerging || isSubmitting}
          onClick={handleMerge}
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
          {/* Show out of date notice or workflow logs */}
          {isBranchOutOfDateOverall && !currentWorkflowRunId ? (
            <OutOfDateNotice
              isBranchOutOfDateMigrations={isBranchOutOfDateMigrations}
              missingMigrationsCount={missingMigrationsCount}
              hasNewerRemovedFunctions={hasNewerRemovedFunctions}
              newerRemovedFunctionsCount={newerRemovedFunctionsCount}
              hasNewerModifiedFunctions={hasNewerModifiedFunctions}
              newerModifiedFunctionsCount={newerModifiedFunctionsCount}
              hasEdgeFunctionModifications={hasEdgeFunctionModifications}
              modifiedFunctionsCount={modifiedFunctionsCount}
              isPushing={isPushing}
              onPush={handlePush}
            />
          ) : currentWorkflowRunId ? (
            <div className="my-6">
              <WorkflowLogsCard
                workflowRunId={currentWorkflowRunId}
                projectRef={relatedWorkflowRunIds[currentWorkflowRunId] || ref || ''}
                onClose={() => {
                  const { workflow_run_id, ...queryWithoutWorkflowId } = router.query
                  router.push({
                    pathname: router.pathname,
                    query: queryWithoutWorkflowId,
                  })
                }}
                onStatusChange={handleWorkflowStatusChange}
                statusComplete="FUNCTIONS_DEPLOYED"
                statusFailed={['MIGRATIONS_FAILED', 'FUNCTIONS_FAILED']}
                headerTitle={hasCurrentWorkflowFailed ? 'Workflow failed' : undefined}
                headerDescription={
                  hasCurrentWorkflowFailed
                    ? 'Consider creating a fresh branch from the latest production branch to resolve potential conflicts.'
                    : undefined
                }
                headerIcon={
                  hasCurrentWorkflowFailed ? (
                    <AlertTriangle
                      size={16}
                      strokeWidth={1.5}
                      className="text-destructive shrink-0"
                    />
                  ) : undefined
                }
                headerAction={
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
        {/* Content based on selected tab */}
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
    </PageLayout>
  )
}

MergePage.getLayout = (page) => (
  <DefaultLayout>
    <ProjectLayoutWithAuth>{page}</ProjectLayoutWithAuth>
  </DefaultLayout>
)

export default MergePage
