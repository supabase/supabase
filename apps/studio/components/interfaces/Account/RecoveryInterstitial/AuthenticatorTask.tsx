import { useState } from 'react'
import { Button } from 'ui'

import { AddNewFactorModal } from '../TOTPFactors/AddNewFactorModal'
import { RecoveryTaskRow } from './RecoveryTaskRow'

export const AuthenticatorTask = ({
  onStart,
  onComplete,
  onRecoveryCodesSaved,
}: {
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
      <AddNewFactorModal
        visible={isOpen}
        onClose={handleClose}
        onComplete={handleComplete}
        onRecoveryCodesSaved={onRecoveryCodesSaved}
      />
    </>
  )
}
