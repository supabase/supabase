import { partition } from 'lodash'
import { useState } from 'react'

import { useParams } from 'common'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import TextConfirmModal from 'components/ui/Modals/TextConfirmModal'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useBranchDeleteMutation } from 'data/branches/branch-delete-mutation'
import { Branch, useBranchesQuery } from 'data/branches/branches-query'
import { useSelectedProject, useStore } from 'hooks'
import { Button, IconSearch, Input } from 'ui'
import { BranchHeader, BranchPanel, MainBranchPanel } from './BranchPanels'
import UpdateBranchSidePanel from './UpdateBranchSidePanel'

const BranchManagement = () => {
  const { ui } = useStore()
  const { ref } = useParams()
  const projectDetails = useSelectedProject()

  const isBranch = projectDetails?.parent_project_ref !== undefined
  const projectRef =
    projectDetails !== undefined ? (isBranch ? projectDetails.parent_project_ref : ref) : undefined

  const [selectedBranchToUpdate, setSelectedBranchToUpdate] = useState<Branch>()
  const [selectedBranchToDelete, setSelectedBranchToDelete] = useState<Branch>()

  const { data: branches, error, isLoading, isError, isSuccess } = useBranchesQuery({ projectRef })
  const [[mainBranch], previewBranches] = partition(branches, (branch) => branch.is_default)

  const { mutate: deleteBranch, isLoading: isDeleting } = useBranchDeleteMutation({
    onSuccess: () => {
      setSelectedBranchToDelete(undefined)
      ui.setNotification({ category: 'success', message: 'Successfully deleted branch' })
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
              <Button>Create preview branch</Button>
            </div>
            <div className="">
              {isLoading && <GenericSkeletonLoader />}
              {isError && <AlertError error={error} subject="Failed to retrieve branches" />}
              {isSuccess && (
                <>
                  <MainBranchPanel branch={mainBranch} onSelectUpdate={() => {}} />
                  <BranchHeader markdown={`#### Preview branches`} />
                  {previewBranches.map((branch) => (
                    <BranchPanel
                      key={branch.id}
                      branch={branch}
                      onSelectUpdate={() => setSelectedBranchToUpdate(branch)}
                      onSelectDelete={() => setSelectedBranchToDelete(branch)}
                    />
                  ))}
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

      <UpdateBranchSidePanel
        selectedBranch={selectedBranchToUpdate}
        onClose={() => setSelectedBranchToUpdate(undefined)}
      />
    </>
  )
}

export default BranchManagement
