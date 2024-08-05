import toast from 'react-hot-toast'

import { useParams } from 'common'
import { useS3AccessKeyDeleteMutation } from 'data/storage/s3-access-key-delete-mutation'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
} from 'ui'

interface RevokeCredentialModalProps {
  visible: boolean
  selectedCredential?: { id: string; description: string }
  onClose: () => void
}

export const RevokeCredentialModal = ({
  visible,
  selectedCredential,
  onClose,
}: RevokeCredentialModalProps) => {
  const { ref: projectRef } = useParams()
  const { mutate: deleteS3AccessKey, isLoading: isDeleting } = useS3AccessKeyDeleteMutation({
    onSuccess: () => {
      toast.success('Successfully revoked S3 access key')
      onClose()
    },
  })

  return (
    <Dialog open={visible}>
      <DialogContent size="small">
        <DialogHeader>
          <DialogTitle>
            Revoke credential <code className="text-sm">{selectedCredential?.description}</code>
          </DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection>
          <DialogDescription>
            This action is irreversible and requests made with these access keys will stop working.
          </DialogDescription>
        </DialogSection>
        <DialogFooter className="flex justify-end gap-x-1">
          <Button type="outline" onClick={() => onClose()}>
            Cancel
          </Button>
          <Button
            type="danger"
            loading={isDeleting}
            onClick={async () => {
              if (!selectedCredential) return
              deleteS3AccessKey({ id: selectedCredential.id, projectRef })
            }}
          >
            Yes, revoke access keys
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
