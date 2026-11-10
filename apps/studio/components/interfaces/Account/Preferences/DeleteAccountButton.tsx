import { zodResolver } from '@hookform/resolvers/zod'
import { SupportCategories } from '@supabase/shared-types/out/constants'
import { LOCAL_STORAGE_KEYS, safeLocalStorage } from 'common'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
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
  DialogTrigger,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  Input,
} from 'ui'
import * as z from 'zod'

import { NO_PROJECT_MARKER } from '@/components/interfaces/Support/SupportForm.utils'
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

  const accountEmail = profile?.primary_email
  const FormSchema = z.object({ account: z.string() })
  const form = useForm<z.infer<typeof FormSchema>>({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    resolver: zodResolver(FormSchema),
    defaultValues: { account: '' },
  })
  const account = useWatch({ control: form.control, name: 'account' })

  const handleOpenChange = (open: boolean) => {
    if (open) form.reset()
    setIsOpen(open)
  }

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

  const handleSubmitDeletionRequest = ({ account }: z.infer<typeof FormSchema>) => {
    if (!canRequestDeletion || !accountEmail || account !== accountEmail || isPending) return

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
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="danger" loading={!accountEmail}>
          Request deletion
        </Button>
      </DialogTrigger>
      <DialogContent size="small" hideClose={belongsToOrganizations}>
        <DialogHeader>
          <DialogTitle>
            {belongsToOrganizations ? 'Leave all organizations first' : 'Request account deletion?'}
          </DialogTitle>
        </DialogHeader>

        <DialogSection className="border-t">
          <DialogDescription className="text-foreground">
            {isCheckingOrganizations && 'Checking your organization memberships…'}
            {hasOrganizationCheckFailed && 'Could not check your organization memberships.'}
            {belongsToOrganizations &&
              'Leave or delete every organization you belong to before requesting account deletion.'}
            {canRequestDeletion && 'Deleting your account is permanent and cannot be undone.'}
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

        {canRequestDeletion && (
          <Form {...form}>
            <form
              id="account-deletion-request"
              onSubmit={form.handleSubmit(handleSubmitDeletionRequest)}
            >
              <DialogSection className="pt-0">
                <FormField
                  name="account"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Enter your email address to confirm</FormLabel>
                      <FormControl>
                        <Input {...field} autoFocus autoComplete="off" disabled={isPending} />
                      </FormControl>
                      <FormDescription>Use {accountEmail}.</FormDescription>
                    </FormItem>
                  )}
                />
              </DialogSection>

              <DialogFooter>
                <Button
                  variant="danger"
                  type="submit"
                  loading={isPending}
                  disabled={account !== accountEmail || isPending}
                >
                  Submit deletion request
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
