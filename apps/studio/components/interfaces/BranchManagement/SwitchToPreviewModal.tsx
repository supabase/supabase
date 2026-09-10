import { toast } from 'sonner'
import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'

import { useBranchUpdateMutation } from '@/data/branches/branch-update-mutation'
import { type Branch } from '@/data/branches/branches-query'

interface SwitchToPreviewModalProps {
  open: boolean
  branch?: Branch
  onClose: () => void
}

export const SwitchToPreviewModal = ({ open, branch, onClose }: SwitchToPreviewModalProps) => {
  const { mutate: updateBranch, isPending: isUpdatingBranch } = useBranchUpdateMutation({
    onSuccess() {
      toast.success('Successfully updated branch')
      onClose()
    },
  })

  const onSwitchToPreview = () => {
    if (branch === undefined) return
    updateBranch({
      branchRef: branch.project_ref,
      projectRef: branch.parent_project_ref,
      persistent: false,
    })
  }

  return (
    <ConfirmationModal
      variant="default"
      visible={open}
      confirmLabel="Switch to preview"
      title="Switch branch to preview before deleting"
      loading={isUpdatingBranch}
      disabled={branch === undefined}
      onCancel={() => onClose()}
      onConfirm={onSwitchToPreview}
    >
      <p className="text-sm text-foreground-light">
        You must switch the branch "{branch?.name}" to preview before deleting it.
      </p>
    </ConfirmationModal>
  )
}
