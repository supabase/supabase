import { TextConfirmModal } from '@/components/ui/TextConfirmModalWrapper'

interface DeleteTokenConfirmModalProps {
  visible: boolean
  tokenName: string | undefined
  loading: boolean
  onCancel: () => void
  onConfirm: () => void
}

/**
 * Type-to-confirm modal for deleting an access token. Shared by the classic and
 * scoped token lists so the confirmation copy and behavior stay in sync.
 */
export const DeleteTokenConfirmModal = ({
  visible,
  tokenName,
  loading,
  onCancel,
  onConfirm,
}: DeleteTokenConfirmModalProps) => {
  return (
    <TextConfirmModal
      visible={visible}
      variant="destructive"
      title="Confirm to delete"
      loading={loading}
      confirmLabel="Delete"
      confirmString={tokenName ?? ''}
      confirmPlaceholder="Type the token name to confirm"
      text={
        <>
          This action cannot be undone. This will permanently delete the{' '}
          <span className="font-bold text-foreground">{tokenName}</span> token.
        </>
      }
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  )
}
