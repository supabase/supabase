import { TextConfirmModal } from 'components/ui/TextConfirmModalWrapper'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { toast } from 'sonner'

export interface DeleteProjectDialogProps {
  visible: boolean
  projectRef: string
  projectName: string
  onClose: () => void
  onSuccess: () => void
}

export const DeleteProjectDialog = ({
  visible,
  projectRef,
  projectName,
  onClose,
  onSuccess,
}: DeleteProjectDialogProps) => {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleClose = () => {
    setDeleteError(null)
    onClose()
  }

  const handleConfirm = async () => {
    setIsDeleting(true)
    setDeleteError(null)

    try {
      const response = await fetch(`/api/platform/projects/${projectRef}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: projectName }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        const message =
          (data as any)?.message || (data as any)?.error || 'Failed to delete project'
        setDeleteError(message)
        return
      }

      toast.success(`Project "${projectName}" deleted successfully`)
      onSuccess()
      handleClose()
      router.push('/projects')
    } catch (_err) {
      setDeleteError('An unexpected error occurred. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <TextConfirmModal
      visible={visible}
      onCancel={handleClose}
      onConfirm={handleConfirm}
      loading={isDeleting}
      title={`Delete project "${projectName}"`}
      confirmPlaceholder={`Type "${projectName}" to confirm`}
      confirmString={projectName}
      confirmLabel="Delete project"
      cancelLabel="Cancel"
      variant="destructive"
      text={
        <p className="text-sm text-foreground-light">
          This action <strong>cannot be undone</strong>. All data in this project will be permanently
          deleted, including all tables, functions, and credentials.
        </p>
      }
      alert={{
        title: 'This will delete the project and all its data',
        description: deleteError ?? undefined,
      }}
    />
  )
}
