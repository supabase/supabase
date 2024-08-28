import { zodResolver } from '@hookform/resolvers/zod'
import { SupportCategories } from '@supabase/shared-types/out/constants'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import * as z from 'zod'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'

import { useSendSupportTicketMutation } from 'data/feedback/support-ticket-send'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useProfile } from 'lib/profile'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
} from 'ui'

const setDeletionRequestFlag = () => {
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + 30)
  localStorage.setItem(LOCAL_STORAGE_KEYS.ACCOUNT_DELETION_REQUEST, expiryDate.toString())
}

const hasActiveDeletionRequest = () => {
  const expiryDateStr = localStorage.getItem(LOCAL_STORAGE_KEYS.ACCOUNT_DELETION_REQUEST)
  if (!expiryDateStr) return false

  const expiryDate = new Date(expiryDateStr)
  const now = new Date()

  if (now > expiryDate) {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.ACCOUNT_DELETION_REQUEST)
    return false
  }

  return true
}

export const DeleteAccountButton = () => {
  const { profile } = useProfile()
  const [isOpen, setIsOpen] = useState(false)
  const { data: organizations, isSuccess } = useOrganizationsQuery()

  const accountEmail = profile?.primary_email
  const FormSchema = z.object({ account: z.string() })
  const form = useForm<z.infer<typeof FormSchema>>({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    resolver: zodResolver(FormSchema),
    defaultValues: { account: '' },
  })
  const { account } = form.watch()

  const { mutate: submitSupportTicket, isLoading } = useSendSupportTicketMutation({
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

  const onConfirmDelete = async () => {
    if (!accountEmail) return console.error('Account information is required')

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
      projectRef: 'no-project',
    }

    submitSupportTicket(payload)
  }

  useEffect(() => {
    if (isOpen && form !== undefined) form.reset({ account: '' })
  }, [form, isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button type="danger" loading={!accountEmail}>
          Request to delete account
        </Button>
      </DialogTrigger>
      <DialogContent className="!w-[500px]">
        <DialogHeader className="pb-0">
          {(organizations ?? []).length > 0 ? (
            <>
              <DialogTitle>Leave all organizations before requesting account deletion</DialogTitle>
              <DialogDescription>
                This will allow us to process your account deletion request faster
              </DialogDescription>
            </>
          ) : (
            <>
              <DialogTitle>Are you sure you want to delete your account?</DialogTitle>
              <DialogDescription>
                Deleting your account is permanent and{' '}
                <span className="text-foreground">cannot</span> be undone
              </DialogDescription>
            </>
          )}
        </DialogHeader>

        {isSuccess && (
          <>
            {organizations.length > 0 ? (
              <DialogSection className="!pt-0">
                <span className="text-sm text-foreground flex flex-col gap-y-2">
                  Before submitting an account deletion request, please ensure that your account is
                  not part of any organization. This can be done by leaving or deleting the
                  organizations that you are a part of.
                </span>
                <Button
                  block
                  type="primary"
                  size="medium"
                  className="mt-6"
                  onClick={() => setIsOpen(false)}
                >
                  Understood
                </Button>
              </DialogSection>
            ) : (
              <Form_Shadcn_ {...form}>
                <form
                  id="account-deletion-request"
                  className="flex flex-col gap-y-4"
                  onSubmit={form.handleSubmit(() => onConfirmDelete())}
                >
                  <FormField_Shadcn_
                    name="account"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem_Shadcn_ className="px-7">
                        <FormLabel_Shadcn_>
                          Please type{' '}
                          <span className="font-bold">{profile?.primary_email ?? ''}</span> to
                          confirm
                        </FormLabel_Shadcn_>
                        <FormControl_Shadcn_>
                          <Input_Shadcn_
                            autoFocus
                            {...field}
                            autoComplete="off"
                            disabled={isLoading}
                            placeholder="Enter the account above"
                          />
                        </FormControl_Shadcn_>
                      </FormItem_Shadcn_>
                    )}
                  />
                  <DialogSectionSeparator />
                  <div className="px-7 pb-4">
                    <Button
                      block
                      size="small"
                      type="danger"
                      htmlType="submit"
                      loading={isLoading}
                      disabled={account !== accountEmail || isLoading}
                    >
                      Submit request for account deletion
                    </Button>
                  </div>
                </form>
              </Form_Shadcn_>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
