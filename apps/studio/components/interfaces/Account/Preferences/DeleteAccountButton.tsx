import { useState } from 'react'
import toast from 'react-hot-toast'

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
  Form,
  Input,
} from 'ui'

export const DeleteAccountButton = () => {
  const { profile } = useProfile()
  const [isOpen, setIsOpen] = useState(false)

  const account = profile?.primary_email

  const onValidate = (values: any) => {
    const errors: any = {}
    if (!values.account) {
      errors.account = 'Enter the account information.'
    }
    if (values.account !== account) {
      errors.account = 'Value entered does not match the value above.'
    }
    return errors
  }

  const { mutate: submitSupportTicket, isLoading } = useSendSupportTicketMutation({
    onSuccess: () => {
      setIsOpen(false)
      toast.success(
        'Successfully submitted account deletion request - we will reach out to you via email once the request is completed!'
      )
    },
    onError: (error) => {
      toast.error(`Failed to submit account deletion request: ${error}`)
    },
  })

  const onConfirmDelete = async () => {
    if (!account) return console.error('Account information is required')

    const payload = {
      subject: 'Account Deletion Request',
      message: 'I want to delete my account.',
      category: 'Account deletion',
      severity: 'Medium',
      allowSupportAccess: false,
    }

    submitSupportTicket(payload)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button type="danger" loading={!account}>
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

        {/* [TODO] Use RHF, old Form component is deprecated */}
        <Form
          validateOnBlur
          initialValues={{ account: '' }}
          onSubmit={onConfirmDelete}
          validate={onValidate}
        >
          {(props: any) => {
            return (
              <div className="space-y-4">
                <Input
                  id="account"
                  label={
                    <span>
                      Please type <span className="font-bold">{profile?.primary_email ?? ''}</span>{' '}
                      to confirm
                    </span>
                  }
                  placeholder="Enter the account above"
                  className="w-full px-7"
                />
                <DialogSectionSeparator />
                <div className="px-7 pb-4">
                  <Button
                    block
                    size="small"
                    type="danger"
                    htmlType="submit"
                    loading={isLoading}
                    disabled={props.values.account !== profile?.primary_email || isLoading}
                  >
                    I understand, delete this account
                  </Button>
                </div>
              </div>
            )
          }}
        </Form>
      </DialogContent>
    </Dialog>
  )
}
