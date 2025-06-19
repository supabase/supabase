import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import Link from 'next/link'
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
      Sentry.captureMessage('Session error detected', 'warning')
    }
  }, [visible])

  return (
    <ConfirmationModal
      visible={visible}
      title="Session timed out"
      confirmLabel="Sign in again"
      onCancel={onClose}
      onConfirm={redirectToSignIn}
      alert={{
        base: { variant: 'warning' },
        title: `Your session has timed out`,
        description: `Please try to sign in again. If you are not able to sign in again, please contact Support.`,
      }}
    >
      <p className="text-sm text-foreground-light">
        Consider{' '}
        <Link href="/support/new" className="underline">
          generating a HAR file
        </Link>{' '}
        from your session to help Support pinpoint the issue.
      </p>
    </ConfirmationModal>
  )
}
