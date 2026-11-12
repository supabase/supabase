import { SupportCategories } from '@supabase/shared-types/out/constants'
import { LOCAL_STORAGE_KEYS, safeLocalStorage } from 'common'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogTitle,
} from 'ui'

import { NO_PROJECT_MARKER } from '@/components/interfaces/Support/SupportForm.utils'
import { TextConfirmModal } from '@/components/ui/TextConfirmModalWrapper'
import { useSendSupportTicketMutation } from '@/data/feedback/support-ticket-send'
import { useOrganizationsQuery } from '@/data/organizations/organizations-query'
import { useProfile } from '@/lib/profile'

const setDeletionRequestFlag = () => {
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + 30)
  safeLocalStorage.setItem(LOCAL_STORAGE_KEYS.ACCOUNT_DELETION_REQUEST, expiryDate.toString())
}

const hasActiveDeletionRequest = () => {
  const expiryDateStr = safeLocalStorage.getItem(LOCAL_STORAGE_KEYS.ACCOUNT_DELETION_REQUEST)
  if (!expiryDateStr) return false

  const expiryDate = new Date(expiryDateStr)
  const now = new Date()

  if (now > expiryDate) {
    safeLocalStorage.removeItem(LOCAL_STORAGE_KEYS.ACCOUNT_DELETION_REQUEST)
    return false
  }

  return true
}

export const DeleteAccountButton = () => {
  const { profile } = useProfile()
  const [isOpen, setIsOpen] = useState(false)
  const {
    data: organizations,
    isSuccess,
    isPending: isCheckingOrganizations,
    isError: hasOrganizationCheckFailed,
    isFetching: isFetchingOrganizations,
    refetch: refetchOrganizations,
  } = useOrganizationsQuery()
  const belongsToOrganizations = isSuccess && organizations.length > 0
  const canRequestDeletion = isSuccess && organizations.length === 0

  const organizationCheckDescription = isCheckingOrganizations
    ? 'Checking your organization memberships…'
    : 'Could not check your organization memberships.'

  const accountEmail = profile?.primary_email

  const { mutate: submitSupportTicket, isPending } = useSendSupportTicketMutation({
    onSuccess: () => {
      setIsOpen(false)
      setDeletionRequestFlag()
      toast.success(
        'Successfully submitted account deletion request - we will reach out to you via email once the request is completed!',
        { duration: 8000 }
      )
    },
    onError: (error) => {
      toast.error(`Failed to submit account deletion request: ${error}`)
    },
  })

  const handleSubmitDeletionRequest = () => {
    if (!canRequestDeletion || !accountEmail || isPending) return

    if (hasActiveDeletionRequest()) {
      return toast.error('You have already submitted a deletion request within the last 30 days.')
    }

    const payload = {
      subject: 'Account Deletion Request',
      message: 'I want to delete my account.',
      category: SupportCategories.ACCOUNT_DELETION,
      severity: 'Low',
      allowSupportAccess: false,
      verified: true,
      projectRef: NO_PROJECT_MARKER,
    }

    submitSupportTicket(payload)
  }

  return (
    <>
      <Button
        variant="danger"
        loading={!accountEmail}
        aria-haspopup="dialog"
        onClick={() => setIsOpen(true)}
      >
        Request deletion
      </Button>

      {canRequestDeletion && accountEmail ? (
        <TextConfirmModal
          visible={isOpen}
          size="small"
          variant="destructive"
          title="Request account deletion"
          confirmString={accountEmail}
          confirmPlaceholder="Type your email address in here"
          confirmLabel="Submit deletion request"
          errorMessage="Enter the email address shown above"
          input={{ autoFocus: true, disabled: isPending }}
          loading={isPending}
          onConfirm={handleSubmitDeletionRequest}
          onCancel={() => setIsOpen(false)}
        >
          <DialogDescription className="text-foreground">
            Deleting your account is permanent and cannot be undone.
          </DialogDescription>
        </TextConfirmModal>
      ) : (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent size="small" hideClose={belongsToOrganizations}>
            <DialogHeader>
              <DialogTitle>
                {belongsToOrganizations
                  ? 'Leave all organizations first'
                  : 'Request account deletion'}
              </DialogTitle>
            </DialogHeader>

            <DialogSection className="border-t">
              <DialogDescription className="text-foreground">
                {belongsToOrganizations
                  ? 'Leave or delete every organization you belong to before requesting account deletion.'
                  : organizationCheckDescription}
              </DialogDescription>
            </DialogSection>

            {hasOrganizationCheckFailed && (
              <DialogFooter>
                <Button
                  variant="primary"
                  loading={isFetchingOrganizations}
                  onClick={() => refetchOrganizations()}
                >
                  Retry
                </Button>
              </DialogFooter>
            )}

            {belongsToOrganizations && (
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="default">Close</Button>
                </DialogClose>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
