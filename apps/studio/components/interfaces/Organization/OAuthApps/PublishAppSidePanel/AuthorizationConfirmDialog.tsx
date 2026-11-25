import { useEffect, useId, useState } from 'react'
import { Checkbox } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import { AuthorizationChanges, getAuthorizationChangeDescriptions } from './Authorization.utils'

export interface AuthorizationConfirmDialogProps {
  visible: boolean
  loading: boolean
  changes: AuthorizationChanges
  onCancel: () => void
  onConfirm: () => void
}

export const AuthorizationConfirmDialog = ({
  visible,
  loading,
  changes,
  onCancel,
  onConfirm,
}: AuthorizationConfirmDialogProps) => {
  const checkboxId = useId()
  const [isAcknowledged, setIsAcknowledged] = useState(false)
  const descriptions = getAuthorizationChangeDescriptions(changes)

  useEffect(() => {
    if (visible) setIsAcknowledged(false)
  }, [visible])

  return (
    <ConfirmationModal
      variant="warning"
      visible={visible}
      loading={loading}
      title="Save these changes permanently?"
      cancelLabel="Go back"
      confirmLabel="Save permanently"
      confirmLabelLoading="Saving changes..."
      disabled={!isAcknowledged}
      onCancel={onCancel}
      onConfirm={onConfirm}
      alert={{
        title: "This can't be undone after you save",
        description: (
          <div className="space-y-2">
            <ul className="list-disc pl-4 space-y-1">
              {descriptions.map((description) => (
                <li key={description}>{description}</li>
              ))}
            </ul>
            <p>Existing connections keep working. Only new connections use this setup.</p>
          </div>
        ),
      }}
    >
      <label htmlFor={checkboxId} className="flex items-start gap-2 cursor-pointer">
        <Checkbox
          id={checkboxId}
          checked={isAcknowledged}
          onCheckedChange={(checked) => setIsAcknowledged(checked === true)}
          className="mt-0.5"
        />
        <span className="text-sm text-foreground">
          I understand this is permanent. I can test it on a duplicate app first
        </span>
      </label>
    </ConfirmationModal>
  )
}
