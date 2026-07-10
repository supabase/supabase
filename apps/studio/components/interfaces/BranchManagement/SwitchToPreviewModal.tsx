import { toast } from 'sonner'
import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'

import { useBranchUpdateMutation } from '@/data/branches/branch-update-mutation'
import { type Branch } from '@/data/branches/branches-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

interface SwitchToPreviewModalProps {
  open: boolean
  branch?: Branch
  onClose: () => void
}

export const SwitchToPreviewModal = ({ open, branch, onClose }: SwitchToPreviewModalProps) => {
  const { data: project } = useSelectedProjectQuery()

  const branchRef = project?.ref
  const projectRef = project?.parent_project_ref

  const { mutate: updateBranch, isPending: isUpdatingBranch } = useBranchUpdateMutation({
    onSuccess() {
      toast.success('Successfully updated branch')
      onClose()
    },
  })

  const onTogglePersistent = () => {
    if (branchRef === undefined || projectRef === undefined || branch === undefined) {
      return console.error('Branch metadata is required')
    }
    updateBranch({ branchRef, projectRef, persistent: !branch.persistent })
  }

  return (
    <ConfirmationModal
      variant="default"
      visible={open}
      confirmLabel="Switch to preview"
      title="Switch branch to preview before deleting"
      loading={isUpdatingBranch}
      onCancel={() => onClose()}
      onConfirm={onTogglePersistent}
    >
      <p className="text-sm text-foreground-light">
        You must switch the branch "{branch?.name}" to preview before deleting it.
      </p>
    </ConfirmationModal>
  )
}
