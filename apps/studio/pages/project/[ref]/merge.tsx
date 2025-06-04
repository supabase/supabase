import { useState } from 'react'
import { useRouter } from 'next/router'
import { DiffEditor } from '@monaco-editor/react'
import { editor as monacoEditor } from 'monaco-editor'

import { useParams } from 'common'
import { ProjectLayoutWithAuth } from 'components/layouts/ProjectLayout/ProjectLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useBranchesQuery } from 'data/branches/branches-query'
import { useBranchMergeMutation } from 'data/branches/branch-merge-mutation'
import { useBranchDiffQuery } from 'data/branches/branch-diff-query'
import { Button } from 'ui'
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
    { branchId: currentBranch?.id || '', projectRef: parentProjectRef || '' },
    { enabled: !!currentBranch?.id }
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

  // Monaco editor options for diff display
  const defaultOptions: monacoEditor.IStandaloneDiffEditorConstructionOptions = {
    readOnly: true,
    renderSideBySide: false,
    minimap: { enabled: false },
    wordWrap: 'on',
    lineNumbers: 'on',
    folding: false,
    padding: { top: 16, bottom: 16 },
    lineNumbersMinChars: 3,
    fontSize: 13,
    scrollBeyondLastLine: false,
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
        {isDiffLoading ? (
          <div className="p-6 text-center">
            <p>Loading branch diff...</p>
          </div>
        ) : diffError ? (
          <div className="p-6 text-center text-red-500">
            <p>Error loading branch diff: {diffError.message}</p>
          </div>
        ) : !diffContent || diffContent.trim() === '' ? (
          <div className="p-6 text-center">
            <p>No changes detected between branches</p>
          </div>
        ) : (
          <div className="h-96 border rounded-lg overflow-hidden">
            <DiffEditor
              theme="supabase"
              language="sql"
              height="100%"
              original=""
              modified={diffContent}
              options={defaultOptions}
            />
          </div>
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
