import { toast } from 'sonner'
import TextConfirmModal from 'ui-patterns/Dialogs/TextConfirmModal'

import { useBranchDeleteMutation } from '@/data/branches/branch-delete-mutation'
import { type Branch } from '@/data/branches/branches-query'

export interface DeleteBranchModalProps {
  open: boolean
  branch?: Branch
  onClose: () => void
  onSuccess?: () => void
}

export const DeleteBranchModal = ({ open, branch, onClose, onSuccess }: DeleteBranchModalProps) => {
  const { mutate: deleteBranch, isPending: isDeleting } = useBranchDeleteMutation({
    onSuccess: () => {
      toast.success('Successfully deleted branch')
      onSuccess?.()
      onClose()
    },
  })

  const onConfirmDeleteBranch = () => {
    if (!branch) return console.error('No branch selected')

    const { project_ref: branchRef, parent_project_ref: projectRef } = branch
    deleteBranch({ branchRef, projectRef })
  }

  return (
    <TextConfirmModal
      variant="destructive"
      visible={open}
      onCancel={() => onClose()}
      onConfirm={() => onConfirmDeleteBranch()}
      loading={isDeleting}
      title="Delete branch"
      confirmLabel="Delete branch"
      confirmPlaceholder="Type in name of branch"
      confirmString={branch?.name ?? ''}
      alert={{
        title: 'You cannot recover this branch once deleted',
      }}
      text={
        <>
          This will delete your database preview branch{' '}
          <span className="text-bold text-foreground">{branch?.name}</span>.
        </>
      }
    />
  )
}
