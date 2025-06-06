import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
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
import { Button } from 'ui'
import {
  Tabs_Shadcn_ as Tabs,
  TabsContent_Shadcn_ as TabsContent,
  TabsList_Shadcn_ as TabsList,
  TabsTrigger_Shadcn_ as TabsTrigger,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from 'ui'
import { toast } from 'sonner'
import type { NextPageWithLayout } from 'types'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import { CheckCircle2, CircleDotDashed } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'

const MergePage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = useParams()
  const project = useSelectedProject()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isBranch = project?.parent_project_ref !== undefined
  const parentProjectRef = project?.parent_project_ref

  // Get branch information
  const { data: branches } = useBranchesQuery({ projectRef: parentProjectRef })
  const currentBranch = branches?.find((branch) => branch.project_ref === ref)
  const mainBranch = branches?.find((branch) => branch.is_default)

  // Get workflow run ID from URL query parameter
  const workflowRunId = router.query.workflow_run_id as string | undefined
  const attemptedMerge = !!workflowRunId

  // Get workflow runs to find the specific workflow run for status
  const { data: workflowRuns } = useWorkflowRunsQuery(
    { projectRef: parentProjectRef },
    {
      enabled: !!parentProjectRef && !!workflowRunId,
      refetchInterval: 3000, // Poll every 3 seconds to check for status changes
    }
  )

  // Find the specific workflow run by ID
  const currentWorkflowRun = workflowRuns?.find((run) => run.id === workflowRunId)

  // Determine if we should be polling based on workflow status
  const isPolling =
    currentWorkflowRun &&
    currentWorkflowRun.status !== 'FUNCTIONS_DEPLOYED' &&
    currentWorkflowRun.status !== 'MIGRATIONS_FAILED' &&
    currentWorkflowRun.status !== 'FUNCTIONS_FAILED'

  // Get logs for the specific workflow run and poll until completion
  const { data: workflowRunLogs } = useWorkflowRunQuery(
    { workflowRunId },
    {
      enabled: !!workflowRunId,
      refetchInterval: isPolling ? 2000 : false, // Poll logs every 2 seconds until complete
    }
  )

  // Get diff using the new endpoint
  const {
    data: diffContent,
    isLoading: isDiffLoading,
    error: diffError,
    refetch: refetchDiff,
  } = useBranchDiffQuery(
    {
      branchId: currentBranch?.id || '',
      projectRef: parentProjectRef || '',
    },
    { enabled: !!currentBranch?.id }
  )

  // Show toast notifications when workflow status changes
  useEffect(() => {
    if (currentWorkflowRun?.status) {
      const status = currentWorkflowRun.status

      if (status === 'FUNCTIONS_DEPLOYED') {
        // Refresh the diff to verify it's empty after successful merge
        refetchDiff()
          .then((result) => {
            const finalDiff = result.data
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
  }, [currentWorkflowRun?.status, refetchDiff])

  // Get edge functions for both branches
  const { data: currentBranchFunctions, isLoading: isCurrentFunctionsLoading } =
    useEdgeFunctionsQuery({ projectRef: ref }, { enabled: !!ref })

  const { data: mainBranchFunctions, isLoading: isMainFunctionsLoading } = useEdgeFunctionsQuery(
    { projectRef: parentProjectRef },
    { enabled: !!parentProjectRef }
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

      // Check for modified functions (functions with more than 1 deployment in current branch)
      const modified = currentFuncs.filter((currentFunc) => {
        const mainFunc = mainFuncs.find((f) => f.slug === currentFunc.slug)
        return mainFunc && currentFunc.version > 1
      })

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

  if (!isBranch || !currentBranch) {
    return (
      <PageLayout title="Merge Request">
        <div className="p-6">
          <p>This page is only available for preview branches.</p>
        </div>
      </PageLayout>
    )
  }

  const breadcrumbs = [
    {
      label: 'Branches',
      href: `/project/${parentProjectRef}/branches`,
    },
  ]

  console.log('diffContent', diffContent)

  const isDataLoaded = !isDiffLoading && !isCurrentFunctionsLoading && !isMainFunctionsLoading
  const hasAnyChanges = hasChanges()
  const isMergeDisabled = !hasAnyChanges && isDataLoaded

  const primaryActions = (
    <div className="flex flex-col items-end gap-2">
      <ButtonTooltip
        tooltip={{
          content: {
            text: isMergeDisabled ? 'No changes to merge' : null,
          },
        }}
        type="primary"
        loading={isMerging || isSubmitting || isPolling}
        disabled={isMergeDisabled}
        onClick={handleMerge}
      >
        {isPolling ? 'Merging...' : 'Merge branch'}
      </ButtonTooltip>
    </div>
  )

  const pageTitle = () => (
    <span>
      Merge <span className="font-mono">{currentBranch.name}</span> into{' '}
      <span className="font-mono">{mainBranch?.name || 'main'}</span>
    </span>
  )

  const pageSubtitle = () => {
    if (!currentBranch?.created_at) return 'Branch information unavailable'

    const createdTime = dayjs(currentBranch.created_at).fromNow()
    return `Created ${createdTime}`
  }

  return (
    <PageLayout
      title={pageTitle()}
      subtitle={pageSubtitle()}
      breadcrumbs={breadcrumbs}
      primaryActions={primaryActions}
    >
      <ScaffoldContainer className="pt-6">
        {/* Show workflow logs when merge is starting or has been attempted */}
        {(isMerging || attemptedMerge) && (
          <Card className="mb-6 overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  {isPolling || isMerging ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    >
                      <CircleDotDashed size={16} strokeWidth={1.5} className="text-warning" />
                    </motion.div>
                  ) : (
                    currentWorkflowRun?.status === 'FUNCTIONS_DEPLOYED' && (
                      <CheckCircle2 size={16} strokeWidth={1.5} className="text-brand" />
                    )
                  )}
                  {currentWorkflowRun?.status || (isMerging ? 'Merge started' : 'Initializing...')}
                  {currentWorkflowRun?.status === 'FUNCTIONS_DEPLOYED' && (
                    <Link
                      href={`/project/${mainBranch?.project_ref}/editor`}
                      className="text-foreground-light hover:text-foreground"
                    >
                      View Branch
                    </Link>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {currentWorkflowRun?.id && (
                    <div className="text-xs text-foreground-light">#{currentWorkflowRun.id}</div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="bg overflow-hidden border-0">
              {workflowRunLogs?.logs ? (
                <pre className="p-0 text-xs font-mono whitespace-pre-wrap text-foreground-light leading-relaxed">
                  {workflowRunLogs.logs}
                  {currentWorkflowRun?.status === 'FUNCTIONS_DEPLOYED' && (
                    <span className="text-brand">Merge complete</span>
                  )}
                </pre>
              ) : (
                <pre className="text-sm text-foreground-light p-0 rounded">
                  {isMerging
                    ? 'Merge started - initializing workflow...'
                    : isPolling
                      ? 'Initializing merge workflow...'
                      : 'Waiting for logs...'}
                </pre>
              )}
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="database" className="w-full">
          <TabsList className="gap-4 mb-8">
            <TabsTrigger value="database">Database</TabsTrigger>
            <TabsTrigger value="edge-functions">Edge Functions</TabsTrigger>
          </TabsList>

          <TabsContent value="database">
            <DatabaseDiffPanel
              diffContent={diffContent}
              isLoading={isDiffLoading}
              error={diffError}
              showRefreshButton={!isPolling}
              onRefresh={() => refetchDiff()}
            />
          </TabsContent>

          <TabsContent value="edge-functions">
            <EdgeFunctionsDiffPanel
              currentBranchFunctions={currentBranchFunctions}
              mainBranchFunctions={mainBranchFunctions}
              isCurrentFunctionsLoading={isCurrentFunctionsLoading}
              isMainFunctionsLoading={isMainFunctionsLoading}
              currentBranchRef={ref}
              mainBranchRef={parentProjectRef}
            />
          </TabsContent>
        </Tabs>
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
