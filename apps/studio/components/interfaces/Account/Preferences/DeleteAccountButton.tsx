import { useState } from 'react'
import { Button, Form, Input, Modal } from 'ui'

import { useSendSupportTicketMutation } from 'data/feedback/support-ticket-send'
import type { Profile } from 'data/profile/types'
import toast from 'react-hot-toast'

const DeleteAccountButton = ({ profile }: { profile?: Profile }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [value, setValue] = useState('')
  const [supportTicketSubmissionStatus, setSupportTicketSubmissionStatus] = useState<
    boolean | null
  >(null)

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
      setSupportTicketSubmissionStatus(true)
    },
    onError: (error) => {
      setSupportTicketSubmissionStatus(false)
    },
  })

  const onConfirmDelete = async (values: any) => {
    if (!account) return console.error('Account information is required')

    const payload = {
      subject: 'Account Deletion Request',
      message: 'I want to delete my account.',
      category: 'Account deletion',
      severity: 'Medium',
      allowSupportAccess: false,
    }

    try {
      await submitSupportTicket(payload)
      setIsOpen(false)
    } catch (error) {
      toast.error(`Failed to submit account deletion request: ${error}`)
    } finally {
      toast.success(
        'Successfully submitted account deletion request - we will reach out to you via email once the request is completed!'
      )
    }
  }

  return (
    <>
      <div className="mt-2">
        <Button loading={!account} onClick={() => setIsOpen(true)} type="danger">
          Delete account
        </Button>
      </div>
      <Modal
        closable
        hideFooter
        size="small"
        visible={isOpen}
        onCancel={() => setIsOpen(false)}
        header={
          <div className="flex items-baseline gap-2">
            <h5 className="text-sm text-foreground">Delete account</h5>
            <span className="text-xs text-foreground-lighter">Are you sure?</span>
          </div>
        }
      >
        <Form
          validateOnBlur
          initialValues={{ account: '' }}
          onSubmit={onConfirmDelete}
          validate={onValidate}
        >
          {() => (
            <div className="space-y-4 py-3">
              <Modal.Content>
                <p className="text-sm text-foreground-lighter">
                  This action <span className="text-foreground">cannot</span> be undone. This will
                  permanently delete your account.
                </p>
              </Modal.Content>
              <Modal.Separator />
              <Modal.Content>
                <Input
                  id="account"
                  label={
                    <span>
                      Please type <span className="font-bold">{profile?.primary_email ?? ''}</span>{' '}
                      to confirm
                    </span>
                  }
                  onChange={(e) => setValue(e.target.value)}
                  value={value}
                  placeholder="Enter the account above"
                  className="w-full"
                />
              </Modal.Content>
              <Modal.Separator />
              <Modal.Content>
                <Button
                  block
                  size="small"
                  type="danger"
                  htmlType="submit"
                  loading={isLoading}
                  disabled={isLoading}
                >
                  I understand, delete this account
                </Button>
              </Modal.Content>
            </div>
          )}
        </Form>
      </Modal>
    </>
  )
}

export default DeleteAccountButton
