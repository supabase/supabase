import { toast } from 'sonner'
import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'

import { useUrlSigningKeyRotateMutation } from '@/data/storage/url-signing-key-rotate-mutation'
import type { UrlSigningKey } from '@/data/storage/url-signing-keys-query'
import { useTrack } from '@/lib/telemetry/track'

interface RotateUrlSigningKeyDialogProps {
  projectRef?: string
  standbyKey?: UrlSigningKey
  activeKey?: UrlSigningKey
  onClose: () => void
}

export const RotateUrlSigningKeyDialog = ({
  projectRef,
  standbyKey,
  activeKey,
  onClose,
}: RotateUrlSigningKeyDialogProps) => {
  const track = useTrack()

  const { mutate: rotateKey, isPending } = useUrlSigningKeyRotateMutation({
    onSuccess: () => {
      track('storage_url_signing_key_updated', { change: 'rotated' })
      toast.success('URL signing key rotated')
      onClose()
    },
  })

  return (
    <ConfirmationModal
      visible={!!standbyKey}
      loading={isPending}
      title="Rotate URL signing key"
      description="The standby key becomes the active key and signs all new URLs. The current active key moves to standby and keeps validating the URLs it signed until you revoke it."
      confirmLabel="Rotate key"
      confirmLabelLoading="Rotating key..."
      onCancel={onClose}
      onConfirm={() => {
        if (standbyKey) rotateKey({ projectRef, kid: standbyKey.kid })
      }}
    >
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-foreground-light">Becomes active</dt>
        <dd className="font-mono text-xs self-center truncate">{standbyKey?.kid}</dd>
        {activeKey && (
          <>
            <dt className="text-foreground-light">Moves to standby</dt>
            <dd className="font-mono text-xs self-center truncate">{activeKey.kid}</dd>
          </>
        )}
      </dl>
    </ConfirmationModal>
  )
}
