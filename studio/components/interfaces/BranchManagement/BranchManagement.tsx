import { partition } from 'lodash'
import { useState } from 'react'
import { Button, IconSearch, Input } from 'ui'

import { useParams } from 'common'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import TextConfirmModal from 'components/ui/Modals/TextConfirmModal'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useBranchDeleteMutation } from 'data/branches/branch-delete-mutation'
import { Branch, useBranchesQuery } from 'data/branches/branches-query'
import { useSelectedProject, useStore } from 'hooks'
import { MainBranchPanel } from './BranchPanels'
import CreateBranchSidePanel from './CreateBranchSidePanel'
import PreviewBranches from './PreviewBranches'
import PullRequests from './PullRequests'
import UpdateBranchSidePanel from './UpdateBranchSidePanel'
import { useRouter } from 'next/router'

const BranchManagement = () => {
  const { ui } = useStore()
  const router = useRouter()
  const { ref } = useParams()
  const projectDetails = useSelectedProject()

  const isBranch = projectDetails?.parent_project_ref !== undefined
  const projectRef =
    projectDetails !== undefined ? (isBranch ? projectDetails.parent_project_ref : ref) : undefined

  const [showCreateBranch, setShowCreateBranch] = useState(false)
  const [selectedBranchToUpdate, setSelectedBranchToUpdate] = useState<Branch>()
  const [selectedBranchToDelete, setSelectedBranchToDelete] = useState<Branch>()

  const { data: branches, error, isLoading, isError, isSuccess } = useBranchesQuery({ projectRef })
  const [[mainBranch], previewBranches] = partition(branches, (branch) => branch.is_default)

  const { mutate: deleteBranch, isLoading: isDeleting } = useBranchDeleteMutation({
    onSuccess: () => {
      if (selectedBranchToDelete?.project_ref === ref) {
        ui.setNotification({
          category: 'success',
          message:
            'Successfully deleted branch. You are now currently on the main branch of your project.',
        })
        router.push(`/project/${projectRef}/branches`)
      } else {
        ui.setNotification({ category: 'success', message: 'Successfully deleted branch' })
      }
      setSelectedBranchToDelete(undefined)
    },
  })

  const onConfirmDeleteBranch = () => {
    if (selectedBranchToDelete == undefined) return console.error('No branch selected')
    if (projectRef == undefined) return console.error('Project ref is required')
    deleteBranch({ id: selectedBranchToDelete?.id, projectRef })
  }

  return (
    <>
      <ScaffoldContainer>
        <ScaffoldSection>
          <div className="col-span-12">
            <h3 className="text-xl mb-8">Branch Manager</h3>
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Input placeholder="Search branch" size="small" icon={<IconSearch />} />
              </div>
              <Button onClick={() => setShowCreateBranch(true)}>Create preview branch</Button>
            </div>
            <div className="">
              {isLoading && <GenericSkeletonLoader />}
              {isError && <AlertError error={error} subject="Failed to retrieve branches" />}
              {isSuccess && (
                <>
                  <MainBranchPanel branch={mainBranch} onSelectUpdate={() => {}} />
                  <PullRequests previewBranches={previewBranches} />
                  <PreviewBranches
                    previewBranches={previewBranches}
                    onSelectUpdateBranch={setSelectedBranchToUpdate}
                    onSelectDeleteBranch={setSelectedBranchToDelete}
                  />
                </>
              )}
            </div>
          </div>
        </ScaffoldSection>
      </ScaffoldContainer>

      <TextConfirmModal
        size="medium"
        visible={selectedBranchToDelete !== undefined}
        onCancel={() => setSelectedBranchToDelete(undefined)}
        onConfirm={() => onConfirmDeleteBranch()}
        title="Delete branch"
        loading={isDeleting}
        confirmLabel={`Delete branch`}
        confirmPlaceholder="Type in name of branch"
        confirmString={selectedBranchToDelete?.name ?? ''}
        text={`This will delete your branch "${selectedBranchToDelete?.name}"`}
        alert="You cannot recover this branch once it is deleted!"
      />

      <CreateBranchSidePanel
        visible={showCreateBranch}
        onClose={() => setShowCreateBranch(false)}
      />

      <UpdateBranchSidePanel
        selectedBranch={selectedBranchToUpdate}
        onClose={() => setSelectedBranchToUpdate(undefined)}
      />
    </>
  )
}

export default BranchManagement
