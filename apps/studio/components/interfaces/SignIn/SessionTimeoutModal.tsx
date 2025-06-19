import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import Link from 'next/link'
import { Button } from 'ui'
import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

interface SessionTimeoutModalProps {
  visible: boolean
  onClose: () => void
  redirectToSignIn: () => void
}

export const SessionTimeoutModal = ({
  visible,
  onClose,
  redirectToSignIn,
}: SessionTimeoutModalProps) => {
  useEffect(() => {
    if (visible) {
      Sentry.captureMessage('Session error (detected)', 'warning')
      console.log('logging to sentry now')
    }
  }, [visible])

  const handleSignIn = () => {
    Sentry.captureMessage('Session error (user tries logging in)', 'warning')
    redirectToSignIn()
  }

  return (
    <ConfirmationModal
      visible={visible}
      title="Session timed out"
      confirmLabel="Sign in again"
      onCancel={onClose}
      onConfirm={handleSignIn}
    >
      <p className="text-sm text-foreground-light">
        Your session has timed out. Please try to sign in again.
      </p>
      <p className="text-sm text-foreground-light">
        If you are not able to sign in again, please{' '}
        <Link href="/support/new" className="underline">
          contact Support
        </Link>
        .
      </p>
    </ConfirmationModal>
  )
}
