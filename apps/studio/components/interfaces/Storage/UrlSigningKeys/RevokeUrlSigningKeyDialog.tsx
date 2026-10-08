import { toast } from 'sonner'

import { TextConfirmModal } from '@/components/ui/TextConfirmModalWrapper'
import { useUrlSigningKeyUpdateMutation } from '@/data/storage/url-signing-key-update-mutation'
import type { UrlSigningKey } from '@/data/storage/url-signing-keys-query'

interface RevokeUrlSigningKeyDialogProps {
  projectRef?: string
  selectedKey?: UrlSigningKey
  onClose: () => void
}

export const RevokeUrlSigningKeyDialog = ({
  projectRef,
  selectedKey,
  onClose,
}: RevokeUrlSigningKeyDialogProps) => {
  const { mutate: updateKey, isPending } = useUrlSigningKeyUpdateMutation({
    onSuccess: () => {
      toast.success('URL signing key revoked')
      onClose()
    },
  })

  return (
    <TextConfirmModal
      visible={!!selectedKey}
      loading={isPending}
      variant="destructive"
      title="Revoke URL signing key"
      confirmString={selectedKey?.kid ?? ''}
      confirmPlaceholder="Type the key ID to confirm"
      confirmLabel="Revoke key"
      onCancel={onClose}
      onConfirm={() => {
        if (selectedKey) updateKey({ projectRef, kid: selectedKey.kid, active: false })
      }}
      alert={{
        title: 'URLs signed with this key will stop working',
        description:
          'Revoking this key rejects every signed URL it created, including ones that have not expired yet.',
      }}
    />
  )
}
