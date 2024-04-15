import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import * as z from 'zod'

import { useSendSupportTicketMutation } from 'data/feedback/support-ticket-send'
import { useProfile } from 'lib/profile'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
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

export const DeleteAccountButton = () => {
  const { profile } = useProfile()
  const [isOpen, setIsOpen] = useState(false)

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

    const payload = {
      subject: 'Account Deletion Request',
      message: 'I want to delete my account.',
      category: 'Account deletion',
      severity: 'Medium',
      allowSupportAccess: false,
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
      <DialogContent className="!w-[450px]">
        <DialogHeader className="pb-0">
          <DialogTitle>Are you sure you want to delete your account?</DialogTitle>
          <DialogDescription>
            Deleting your account is permanent and <span className="text-foreground">cannot</span>{' '}
            be undone
          </DialogDescription>
        </DialogHeader>

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
                    Please type <span className="font-bold">{profile?.primary_email ?? ''}</span> to
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
                I understand, delete this account
              </Button>
            </div>
          </form>
        </Form_Shadcn_>
      </DialogContent>
    </Dialog>
  )
}
