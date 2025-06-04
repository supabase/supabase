import { useState } from 'react'
import { useRouter } from 'next/router'

import { useParams } from 'common'
import { ProjectLayoutWithAuth } from 'components/layouts/ProjectLayout/ProjectLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useBranchesQuery } from 'data/branches/branches-query'
import { useBranchMergeMutation } from 'data/branches/branch-merge-mutation'
import { useBranchDiffQuery } from 'data/branches/branch-diff-query'
import { useEdgeFunctionsQuery } from 'data/edge-functions/edge-functions-query'
import DatabaseDiffPanel from 'components/interfaces/BranchManagement/DatabaseDiffPanel'
import EdgeFunctionsDiffPanel from 'components/interfaces/BranchManagement/EdgeFunctionsDiffPanel'
import { Button } from 'ui'
import {
  Tabs_Shadcn_ as Tabs,
  TabsContent_Shadcn_ as TabsContent,
  TabsList_Shadcn_ as TabsList,
  TabsTrigger_Shadcn_ as TabsTrigger,
} from 'ui'
import { toast } from 'sonner'
import type { NextPageWithLayout } from 'types'
import { ScaffoldContainer } from 'components/layouts/Scaffold'

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

  // Get diff using the new endpoint
  const {
    data: diffContent,
    isLoading: isDiffLoading,
    error: diffError,
  } = useBranchDiffQuery(
    {
      branchId: currentBranch?.id || '',
      projectRef: parentProjectRef || '',
    },
    { enabled: !!currentBranch?.id }
  )

  // Get edge functions for both branches
  const { data: currentBranchFunctions, isLoading: isCurrentFunctionsLoading } =
    useEdgeFunctionsQuery({ projectRef: ref }, { enabled: !!ref })

  const { data: mainBranchFunctions, isLoading: isMainFunctionsLoading } = useEdgeFunctionsQuery(
    { projectRef: parentProjectRef },
    { enabled: !!parentProjectRef }
  )

  const { mutate: mergeBranch, isLoading: isMerging } = useBranchMergeMutation({
    onSuccess: () => {
      toast.success('Branch merged successfully!')
      if (parentProjectRef) {
        router.push(`/project/${parentProjectRef}`)
      }
    },
    onError: (error) => {
      toast.error(`Failed to merge branch: ${error.message}`)
    },
  })

  const handleMerge = () => {
    if (!currentBranch?.id || !parentProjectRef) return
    setIsSubmitting(true)
    mergeBranch({
      id: currentBranch.id,
      projectRef: parentProjectRef,
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

  const primaryActions = (
    <Button type="primary" loading={isMerging || isSubmitting} onClick={handleMerge}>
      Merge branch
    </Button>
  )

  const pageTitle = () => (
    <span>
      Merge <span className="font-mono">{currentBranch.name}</span> into{' '}
      <span className="font-mono">{mainBranch?.name || 'main'}</span>
    </span>
  )

  return (
    <PageLayout
      title={pageTitle()}
      subtitle="Saxon created this branch 3 months ago"
      breadcrumbs={breadcrumbs}
      primaryActions={primaryActions}
    >
      <ScaffoldContainer className="pt-6">
        <Tabs defaultValue="database" className="w-full">
          <TabsList>
            <TabsTrigger value="database">Database</TabsTrigger>
            <TabsTrigger value="edge-functions">Edge Functions</TabsTrigger>
          </TabsList>

          <TabsContent value="database">
            <DatabaseDiffPanel
              diffContent={diffContent}
              isLoading={isDiffLoading}
              error={diffError}
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
