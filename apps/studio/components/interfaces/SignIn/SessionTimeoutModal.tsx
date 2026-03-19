import { SupportCategories } from '@supabase/shared-types/out/constants'
import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import { toast } from 'sonner'

import { InlineLink, InlineLinkClassName } from 'components/ui/InlineLink'
import {
  AlertCollapsible,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
} from 'ui'
import { SupportLink } from '../Support/SupportLink'

interface SessionTimeoutModalProps {
  visible: boolean
  onClose: () => void
  redirectToSignIn: () => void
  /** Optional context so the support form can pre-populate when opened from this dialog */
  supportContext?: { projectRef?: string; orgSlug?: string }
}

export const SessionTimeoutModal = ({
  visible,
  onClose,
  redirectToSignIn,
  supportContext,
}: SessionTimeoutModalProps) => {
  useEffect(() => {
    if (visible) {
      Sentry.captureException(new Error('Session error detected'))
    }
  }, [visible])

  const handleClearStorage = () => {
    try {
      localStorage.clear()
      sessionStorage.clear()
    } catch (e) {
      toast.error('Failed to clear browser storage')
    }
    window.location.reload()
  }

  return (
    <AlertDialog
      open={visible}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <AlertDialogContent size="small">
        <AlertDialogHeader>
          <AlertDialogTitle>Session expired</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>Please sign in again to continue.</p>
              <AlertCollapsible trigger="Having trouble?">
                <div className="space-y-3 text-foreground-light">
                  <p>
                    Try a different browser or disable extensions that block network requests. If
                    the problem persists:
                  </p>
                  <Button type="default" size="tiny" onClick={handleClearStorage}>
                    Clear site data and reload
                  </Button>
                  <p>
                    Still stuck?{' '}
                    <SupportLink
                      className={InlineLinkClassName}
                      queryParams={{
                        subject: 'Session expired',
                        category: SupportCategories.LOGIN_ISSUES,
                        ...(supportContext?.projectRef && {
                          projectRef: supportContext.projectRef,
                        }),
                        ...(supportContext?.orgSlug && { orgSlug: supportContext.orgSlug }),
                      }}
                      onClick={onClose}
                    >
                      Contact support
                    </SupportLink>{' '}
                    and include a{' '}
                    <InlineLink href="https://github.com/orgs/supabase/discussions/36540">
                      HAR file
                    </InlineLink>{' '}
                    from your session to help us investigate.
                  </p>
                </div>
              </AlertCollapsible>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
          <AlertDialogAction onClick={redirectToSignIn}>Sign in again</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
