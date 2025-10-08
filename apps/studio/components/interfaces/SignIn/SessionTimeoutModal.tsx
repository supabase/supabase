import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

import { InlineLink } from 'components/ui/InlineLink'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import {
  Accordion_Shadcn_,
  AccordionContent_Shadcn_,
  AccordionItem_Shadcn_,
  AccordionTrigger_Shadcn_,
} from 'ui'

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
        <h3 className="text-sm font-medium">Stuck? Consider these steps</h3>
        <p>
          <ul className="list-disc pl-1.5 list-inside space-y-1 text-sm text-foreground-light">
            <li>Try with a different browser</li>
            <li>Disable any browser extensions that block network requests, such as ad blockers</li>
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
        </p>
        <p>
          If none of these steps work, please{' '}
          <InlineLink href={`/support/new?subject=Session%20timed%20out`}>
            Contact support
          </InlineLink>
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
