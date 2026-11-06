import { toast } from 'sonner'
import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'

import { useBranchUpdateMutation } from '@/data/branches/branch-update-mutation'
import { type Branch } from '@/data/branches/branches-query'
import { useBranchGrant } from '@/hooks/branches/useBranchGrant'

interface SwitchToPreviewModalProps {
  open: boolean
  branch?: Branch
  onClose: () => void
}

export const SwitchToPreviewModal = ({ open, branch, onClose }: SwitchToPreviewModalProps) => {
  const updateBranchGrant = useBranchGrant('PATCH /v1/branches/{branch_id_or_ref}', {
    projectRef: branch?.parent_project_ref,
    isDefault: branch?.is_default,
  })
  const { mutate: updateBranch, isPending: isUpdatingBranch } = useBranchUpdateMutation({
    onSuccess() {
      toast.success('Successfully updated branch')
      onClose()
    },
  })

  const onSwitchToPreview = () => {
    if (branch === undefined || updateBranchGrant.status !== 'granted') return
    updateBranch({
      grant: updateBranchGrant.grant,
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
      disabled={branch === undefined || updateBranchGrant.status !== 'granted'}
      onCancel={() => onClose()}
      onConfirm={onSwitchToPreview}
    >
      <p className="text-sm text-foreground-light">
        You must switch the branch "{branch?.name}" to preview before deleting it.
      </p>
    </ConfirmationModal>
  )
}
