import { useState } from 'react'
import { Button } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import { AddNewFactorModal } from '../TOTPFactors/AddNewFactorModal'
import { RecoveryTaskRow } from './RecoveryTaskRow'

export const AuthenticatorTask = ({
  isPreview,
  onStart,
  onComplete,
  onRecoveryCodesSaved,
}: {
  isPreview: boolean
  onStart: () => void
  onComplete?: () => void
  onRecoveryCodesSaved: () => void
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const handleComplete = () => {
    setIsComplete(true)
    onComplete?.()
  }
  const handleClose = () => setIsOpen(false)

  return (
    <>
      <RecoveryTaskRow
        title={isComplete ? 'Backup authenticator added' : 'Only one authenticator'}
        description={
          isComplete
            ? 'Another authenticator is verified for your account.'
            : 'Add one on another device as a backup.'
        }
        isComplete={isComplete}
      >
        {!isComplete && (
          <Button
            variant="default"
            size="tiny"
            onClick={() => {
              onStart()
              setIsOpen(true)
            }}
          >
            Add authenticator
          </Button>
        )}
      </RecoveryTaskRow>
      {isPreview && (
        <ConfirmationModal
          visible={isOpen}
          title="Preview adding an authenticator"
          confirmLabel="Complete preview"
          onCancel={handleClose}
          onConfirm={() => {
            handleComplete()
            handleClose()
          }}
        >
          <p className="text-sm text-foreground-light">
            In the live flow, scan a QR code on another device and verify its authentication code.
            This preview does not create an authenticator or change your account.
          </p>
        </ConfirmationModal>
      )}
      {!isPreview && (
        <AddNewFactorModal
          visible={isOpen}
          onClose={handleClose}
          onComplete={handleComplete}
          onRecoveryCodesSaved={onRecoveryCodesSaved}
        />
      )}
    </>
  )
}
