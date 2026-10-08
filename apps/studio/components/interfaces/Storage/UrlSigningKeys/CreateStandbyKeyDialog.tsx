import { useState } from 'react'
import { toast } from 'sonner'
import { Badge, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'ui'
import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'

import {
  DEFAULT_URL_SIGNING_KEY_ALGORITHM,
  URL_SIGNING_KEY_ALGORITHMS,
} from './UrlSigningKeys.constants'
import {
  useUrlSigningKeyCreateMutation,
  type UrlSigningKeyAlgorithm,
} from '@/data/storage/url-signing-key-create-mutation'

interface CreateStandbyKeyDialogProps {
  projectRef?: string
  visible: boolean
  onClose: () => void
}

export const CreateStandbyKeyDialog = ({
  projectRef,
  visible,
  onClose,
}: CreateStandbyKeyDialogProps) => {
  const [algorithm, setAlgorithm] = useState<UrlSigningKeyAlgorithm>(
    DEFAULT_URL_SIGNING_KEY_ALGORITHM
  )

  const { mutate: createKey, isPending } = useUrlSigningKeyCreateMutation({
    onSuccess: () => {
      toast.success('Standby key created')
      onClose()
    },
  })

  return (
    <ConfirmationModal
      visible={visible}
      loading={isPending}
      title="Create standby key"
      description="Adds a key that doesn't sign URLs yet. Rotate to it once your application is ready. Existing signed URLs stay valid."
      confirmLabel="Create standby key"
      confirmLabelLoading="Creating standby key..."
      onCancel={onClose}
      onConfirm={() => createKey({ projectRef, algorithm })}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="url-signing-key-algorithm">Algorithm</Label>
        <Select
          value={algorithm}
          onValueChange={(value: UrlSigningKeyAlgorithm) => setAlgorithm(value)}
        >
          <SelectTrigger id="url-signing-key-algorithm">
            <SelectValue placeholder="Select algorithm" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ES256">
              <span>{URL_SIGNING_KEY_ALGORITHMS.ES256.label}</span>
              <Badge variant="success" className="ml-2">
                Recommended
              </Badge>
            </SelectItem>
            <SelectItem value="HS512">{URL_SIGNING_KEY_ALGORITHMS.HS512.label}</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-foreground-lighter">
          {URL_SIGNING_KEY_ALGORITHMS[algorithm].description}
        </p>
      </div>
    </ConfirmationModal>
  )
}
