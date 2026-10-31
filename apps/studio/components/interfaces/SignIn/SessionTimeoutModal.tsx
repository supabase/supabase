import * as Sentry from '@sentry/nextjs'
import { SupportCategories } from '@supabase/shared-types/out/constants'
import { safeLocalStorage, safeSessionStorage } from 'common'
import { useEffect } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  DialogSection,
  DialogSectionSeparator,
} from 'ui'
import {
  DialogDisclosure,
  DialogDisclosureContent,
  DialogDisclosureTrigger,
} from 'ui-patterns/DialogDisclosure'

import { SupportLink } from '../Support/SupportLink'
import { InlineLink, InlineLinkClassName } from '@/components/ui/InlineLink'

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
    safeLocalStorage.clear()
    safeSessionStorage.clear()
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
          <AlertDialogDescription>Please sign in again to continue.</AlertDialogDescription>
        </AlertDialogHeader>
        <DialogSectionSeparator />
        <DialogDisclosure>
          <DialogDisclosureTrigger className="py-4 px-5">Having trouble?</DialogDisclosureTrigger>
          <DialogDisclosureContent>
            <DialogSection className="px-5 pt-1 text-sm">
              <div className="space-y-3 text-foreground-light">
                <p>
                  Try a different browser or disable extensions that block network requests. If the
                  problem persists:
                </p>
                <Button size="tiny" onClick={handleClearStorage}>
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
            </DialogSection>
          </DialogDisclosureContent>
        </DialogDisclosure>
        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
          <AlertDialogAction onClick={redirectToSignIn}>Sign in again</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
