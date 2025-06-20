import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import { useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'

import { useParams } from 'common'
import { ProjectLayoutWithAuth } from 'components/layouts/ProjectLayout/ProjectLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useBranchesQuery } from 'data/branches/branches-query'
import { useBranchMergeMutation } from 'data/branches/branch-merge-mutation'
import { useBranchDiffQuery } from 'data/branches/branch-diff-query'
import { useWorkflowRunQuery } from 'data/workflow-runs/workflow-run-query'
import { useWorkflowRunsQuery } from 'data/workflow-runs/workflow-runs-query'
import { useEdgeFunctionsQuery } from 'data/edge-functions/edge-functions-query'
import DatabaseDiffPanel from 'components/interfaces/BranchManagement/DatabaseDiffPanel'
import EdgeFunctionsDiffPanel from 'components/interfaces/BranchManagement/EdgeFunctionsDiffPanel'
import { Badge, Button, NavMenu, NavMenuItem, cn } from 'ui'
import { toast } from 'sonner'
import type { NextPageWithLayout } from 'types'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import { GitBranchIcon, GitMerge, Shield, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import WorkflowLogsCard from 'components/interfaces/BranchManagement/WorkflowLogsCard'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import { useFlag } from 'hooks/ui/useFlag'

const MergePage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = useParams()
  const queryClient = useQueryClient()

  const gitlessBranching = useFlag('gitlessBranching')

  const project = useSelectedProject()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isBranch = project?.parent_project_ref !== undefined
  const parentProjectRef = project?.parent_project_ref

  // Get branch information
  const { data: branches } = useBranchesQuery(
    { projectRef: parentProjectRef },
    {
      enabled: gitlessBranching && !!parentProjectRef,
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
      staleTime: 0,
    }
  )
  const currentBranch = branches?.find((branch) => branch.project_ref === ref)
  const mainBranch = branches?.find((branch) => branch.is_default)

  // Get workflow run ID from URL query parameter
  const workflowRunId = router.query.workflow_run_id as string | undefined
  const attemptedMerge = !!workflowRunId

  // Get workflow runs to find the specific workflow run for status
  const { data: workflowRuns } = useWorkflowRunsQuery(
    { projectRef: parentProjectRef },
    {
      enabled: gitlessBranching && !!parentProjectRef && !!workflowRunId,
      refetchInterval: 3000, // Poll every 3 seconds to check for status changes
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
      staleTime: 0,
    }
  )

  // Find the specific workflow run by ID
  const currentWorkflowRun = workflowRuns?.find((run) => run.id === workflowRunId)

  // Determine if we should be polling based on workflow status
  const isPolling = Boolean(
    currentWorkflowRun &&
      currentWorkflowRun.status !== 'FUNCTIONS_DEPLOYED' &&
      currentWorkflowRun.status !== 'MIGRATIONS_FAILED' &&
      currentWorkflowRun.status !== 'FUNCTIONS_FAILED'
  )

  // Get logs for the specific workflow run and poll until completion
  const { data: workflowRunLogs } = useWorkflowRunQuery(
    { workflowRunId },
    {
      enabled: gitlessBranching && !!workflowRunId,
      refetchInterval: isPolling ? 2000 : false, // Poll logs every 2 seconds until complete
    }
  )

  // Get diff using the new endpoint
  const {
    data: diffContent,
    isLoading: isDiffLoading,
    isRefetching: isDiffRefetching,
    error: diffError,
    refetch: refetchDiff,
  } = useBranchDiffQuery(
    {
      branchId: currentBranch?.id || '',
      projectRef: parentProjectRef || '',
    },
    {
      enabled: gitlessBranching && !!currentBranch?.id && !!parentProjectRef,
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
      staleTime: 0,
    }
  )

  // Get edge functions for both branches
  const {
    data: currentBranchFunctions,
    isLoading: isCurrentFunctionsLoading,
    refetch: refetchCurrentBranchFunctions,
  } = useEdgeFunctionsQuery(
    { projectRef: ref },
    {
      enabled: gitlessBranching && !!ref,
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
      staleTime: 0,
    }
  )

  const {
    data: mainBranchFunctions,
    isLoading: isMainFunctionsLoading,
    refetch: refetchMainBranchFunctions,
  } = useEdgeFunctionsQuery(
    { projectRef: parentProjectRef },
    {
      enabled: gitlessBranching && !!parentProjectRef,
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
      staleTime: 0,
    }
  )

  // Show toast notifications when workflow status changes
  useEffect(() => {
    if (currentWorkflowRun?.status) {
      const status = currentWorkflowRun.status

      if (status === 'FUNCTIONS_DEPLOYED') {
        // Refresh both database and edge functions diff to verify changes are empty after successful merge
        Promise.all([
          refetchDiff(),
          refetchCurrentBranchFunctions(),
          refetchMainBranchFunctions(),
          // Invalidate edge function body queries used in useEdgeFunctionsDiff
          queryClient.invalidateQueries({ queryKey: ['edge-function-body'] }),
        ])
          .then(([diffResult]) => {
            const finalDiff = diffResult.data
            if (!finalDiff || finalDiff.trim() === '') {
              toast.success('Branch merged successfully! No remaining changes detected.')
            } else {
              toast.success('Branch merged successfully, but some changes may remain.')
            }
          })
          .catch(() => {
            toast.success('Branch merged successfully!')
          })
      } else if (status === 'MIGRATIONS_FAILED' || status === 'FUNCTIONS_FAILED') {
        toast.error(`Branch merge failed with status: ${status}`)
      }
    }
  }, [
    currentWorkflowRun?.status,
    refetchDiff,
    refetchCurrentBranchFunctions,
    refetchMainBranchFunctions,
    queryClient,
  ])

  // Check if there are any changes (database or edge functions)
  const hasChanges = () => {
    // Check database changes
    const hasDatabaseChanges = diffContent && diffContent.trim() !== ''

    // Check edge function changes
    const hasEdgeFunctionChanges = (() => {
      if (!currentBranchFunctions || !mainBranchFunctions) return false

      const currentFuncs = currentBranchFunctions || []
      const mainFuncs = mainBranchFunctions || []

      // Check for added functions
      const added = currentFuncs.filter(
        (currentFunc) => !mainFuncs.find((mainFunc) => mainFunc.slug === currentFunc.slug)
      )

      // Check for removed functions
      const removed = mainFuncs.filter(
        (mainFunc) => !currentFuncs.find((currentFunc) => currentFunc.slug === mainFunc.slug)
      )

      // Check for modified functions (functions present in both branches)
      const modified = currentFuncs.filter((currentFunc) =>
        mainFuncs.some((f) => f.slug === currentFunc.slug)
      )

      return added.length > 0 || removed.length > 0 || modified.length > 0
    })()

    return hasDatabaseChanges || hasEdgeFunctionChanges
  }

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

  // `hasAnyChanges` should be true only when there are *no* pending changes
  const hasAnyChanges = useMemo(
    () => !hasChanges(),
    [diffContent, currentBranchFunctions, mainBranchFunctions]
  )

  // Determine current active tab via query param (defaults to 'database')
  const currentTab = (router.query.tab as string) || 'database'

  // Navigation items for PageLayout - updates the `tab` query param
  const navigationItems = useMemo(() => {
    const buildHref = (tab: string) => {
      const query: Record<string, string> = { tab }
      if (workflowRunId) query.workflow_run_id = workflowRunId
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
  }, [workflowRunId, currentTab])

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

  if (!gitlessBranching) {
    return (
      <PageLayout title="Merge Request">
        <div className="p-6">
          <p>This page is only available for preview branches.</p>
        </div>
      </PageLayout>
    )
  }

  const isDataLoaded = !isDiffLoading && !isCurrentFunctionsLoading && !isMainFunctionsLoading
  const isMergeDisabled = hasAnyChanges && isDataLoaded

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
          loading={isMerging || isSubmitting || isPolling}
          disabled={isMergeDisabled}
          onClick={handleMerge}
          icon={<GitMerge size={16} strokeWidth={1.5} className="text-brand" />}
        >
          {isPolling ? 'Merging...' : 'Merge branch'}
        </ButtonTooltip>
      ) : (
        <Button
          type="primary"
          loading={isMerging || isSubmitting || isPolling}
          onClick={handleMerge}
          icon={<GitMerge size={16} strokeWidth={1.5} className="text-brand" />}
        >
          {isPolling ? 'Merging...' : 'Merge branch'}
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
          {/* Merge workflow logs */}
          <WorkflowLogsCard
            attemptedMerge={attemptedMerge}
            isMerging={isMerging}
            isPolling={!!isPolling}
            currentWorkflowRun={currentWorkflowRun}
            workflowRunLogs={workflowRunLogs}
            mainBranchRef={mainBranch?.project_ref}
          />

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
            isLoading={isDiffLoading || isDiffRefetching}
            error={diffError}
            showRefreshButton={!isPolling}
            currentBranchRef={ref}
          />
        ) : (
          <EdgeFunctionsDiffPanel
            currentBranchFunctions={currentBranchFunctions}
            mainBranchFunctions={mainBranchFunctions}
            isCurrentFunctionsLoading={isCurrentFunctionsLoading}
            isMainFunctionsLoading={isMainFunctionsLoading}
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
