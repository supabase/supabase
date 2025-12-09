import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

import { InlineLink, InlineLinkClassName } from 'components/ui/InlineLink'
import { toast } from 'sonner'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { SupportLink } from '../Support/SupportLink'

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
      Sentry.captureException(new Error('Session error detected'))
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
        title: 'Your session has timed out',
        description:
          'Please try signing in again. If you are not able to sign in again, please contact Support.',
      }}
    >
      <div className="space-y-4 text-sm text-foreground-light">
        <ul className="list-disc pl-1.5 list-inside space-y-1 text-sm text-foreground-light">
          <li>Try with a different browser</li>
          <li>Disable browser extensions that block network requests</li>
          <li>
            <button
              title="Clear storage and reload"
              className="underline"
              onClick={() => {
                try {
                  localStorage.clear()
                  sessionStorage.clear()
                } catch (e) {
                  toast.error('Failed to clear browser storage')
                }
                window.location.reload()
              }}
            >
              Clear your browser storage
            </button>
          </li>
        </ul>
        <p>
          If none of these steps work, please{' '}
          <SupportLink
            className={InlineLinkClassName}
            queryParams={{ subject: 'Session timed out' }}
          >
            Contact support
          </SupportLink>
          .
        </p>
        <p>
          Consider{' '}
          <InlineLink href="https://github.com/orgs/supabase/discussions/36540">
            generating a HAR file
          </InlineLink>{' '}
          from your session to help Support pinpoint the issue.
        </p>
      </div>
    </ConfirmationModal>
  )
}
