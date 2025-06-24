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
import { useBranchDiffQuery } from 'data/branches/branch-diff-query'
import { useBranchPushMutation } from 'data/branches/branch-push-mutation'
import { useMigrationsQuery } from 'data/database/migrations-query'
import { useEdgeFunctionsQuery } from 'data/edge-functions/edge-functions-query'
import DatabaseDiffPanel from 'components/interfaces/BranchManagement/DatabaseDiffPanel'
import EdgeFunctionsDiffPanel from 'components/interfaces/BranchManagement/EdgeFunctionsDiffPanel'
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
import { Admonition } from 'ui-patterns'

const MergePage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = useParams()
  const queryClient = useQueryClient()

  const gitlessBranching = useFlag('gitlessBranching')

  const project = useSelectedProject()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // State to track related workflow runs with their project refs
  const [relatedWorkflowRunIds, setRelatedWorkflowRunIds] = useState<Record<string, string>>({})

  const isBranch = project?.parent_project_ref !== undefined
  const parentProjectRef = project?.parent_project_ref

  const parentProject = useProjectByRef(parentProjectRef)

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

  // Get migrations for both current branch and main branch
  const { data: currentBranchMigrations, refetch: refetchCurrentBranchMigrations } =
    useMigrationsQuery(
      {
        projectRef: ref,
        connectionString: project?.connectionString,
      },
      {
        enabled: gitlessBranching && !!ref,
        staleTime: 30000, // 30 seconds
      }
    )

  const { data: mainBranchMigrations, refetch: refetchMainBranchMigrations } = useMigrationsQuery(
    {
      projectRef: parentProjectRef,
      // @ts-ignore - connectionString property exists but TypeScript doesn't recognize it
      connectionString: parentProject?.connectionString,
    },
    {
      enabled: gitlessBranching && !!parentProjectRef,
      staleTime: 0,
    }
  )

  console.log('migrations:', currentBranchMigrations, mainBranchMigrations)

  // Check if current branch is out of date with main branch
  const isBranchOutOfDate = useMemo(() => {
    if (!currentBranchMigrations || !mainBranchMigrations) return false

    // Get the latest migration version from main branch
    const latestMainMigration = mainBranchMigrations[0] // migrations are ordered by version desc
    if (!latestMainMigration) return false

    // Check if current branch has this latest migration
    const hasLatestMigration = currentBranchMigrations.some(
      (migration) => migration.version === latestMainMigration.version
    )

    return !hasLatestMigration
  }, [currentBranchMigrations, mainBranchMigrations])

  // Get the count of migrations that the branch is missing
  const missingMigrationsCount = useMemo(() => {
    if (!currentBranchMigrations || !mainBranchMigrations || !isBranchOutOfDate) return 0

    const currentVersions = new Set(currentBranchMigrations.map((m) => m.version))
    return mainBranchMigrations.filter((m) => !currentVersions.has(m.version)).length
  }, [currentBranchMigrations, mainBranchMigrations, isBranchOutOfDate])

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
      refetchOnWindowFocus: false,
      staleTime: 0,
    }
  )

  // Get edge functions for both branches
  const { data: currentBranchFunctions, isLoading: isCurrentFunctionsLoading } =
    useEdgeFunctionsQuery(
      { projectRef: ref },
      {
        enabled: gitlessBranching && !!ref,
        staleTime: 30000, // 30 seconds
      }
    )

  const { data: mainBranchFunctions, isLoading: isMainFunctionsLoading } = useEdgeFunctionsQuery(
    { projectRef: parentProjectRef },
    {
      enabled: gitlessBranching && !!parentProjectRef,
      staleTime: 30000, // 30 seconds
    }
  )

  // Handle workflow completion - refetch diff once when workflow completes or fails
  const handleWorkflowStatusChange = useCallback(
    (status: string, workflowRunId: string) => {
      const isComplete =
        status === 'FUNCTIONS_DEPLOYED' ||
        status === 'MIGRATIONS_FAILED' ||
        status === 'FUNCTIONS_FAILED'

      if (isComplete) {
        // Refetch diff once when workflow completes
        refetchDiff()
      }
    },
    [refetchDiff]
  )

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

  // `hasAnyChanges` should be true only when there are *no* pending changes
  const hasAnyChanges = useMemo(
    () => !hasChanges(),
    [diffContent, currentBranchFunctions, mainBranchFunctions]
  )

  // Determine current active tab via query param (defaults to 'database')
  const currentTab = (router.query.tab as string) || 'database'

  // Get the current workflow run ID from URL
  const currentWorkflowRunId = router.query.workflow_run_id as string | undefined

  // Check if we have any active workflow runs
  const hasActiveWorkflowRuns = Object.keys(relatedWorkflowRunIds).length > 0

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
          disabled={isBranchOutOfDate}
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

  // Out of date notice component
  const OutOfDateNotice = () => (
    <Admonition type="warning" className="my-4">
      <div className="w-full flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">
            Missing {missingMigrationsCount} migration{missingMigrationsCount !== 1 ? 's' : ''} from
            main branch
          </h3>
          <p className="text-sm text-foreground-light">
            Update this branch or create a new one to review and merge your changes.
          </p>
        </div>
        <Button
          type="default"
          loading={isPushing}
          onClick={handlePush}
          icon={<GitBranchIcon size={16} strokeWidth={1.5} />}
          className="shrink-0"
        >
          {isPushing ? 'Updating...' : 'Update branch'}
        </Button>
      </div>
    </Admonition>
  )

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
          {isBranchOutOfDate && !currentWorkflowRunId ? (
            <OutOfDateNotice />
          ) : currentWorkflowRunId ? (
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
            />
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
            isLoading={isDiffLoading || isDiffRefetching}
            error={diffError}
            showRefreshButton={true}
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
