import React, { useState } from 'react'
import Panel from 'components/ui/Panel'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import {
  Button,
  Modal,
  Alert_Shadcn_,
  AlertTitle_Shadcn_,
  AlertDescription_Shadcn_,
  IconAlertTriangle,
} from 'ui'
import { useSendSupportTicketMutation } from 'data/feedback/support-ticket-send'
import toast from 'react-hot-toast'

const AccountDeletion = () => {
  const [showDelete, setShowDelete] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { mutate: submitSupportTicket, isLoading } = useSendSupportTicketMutation({
    onSuccess: () => {
      toast.success('Support request sent. Thank you!')
      setShowDelete(false)
      setIsSubmitting(false)
    },
    onError: (error) => {
      toast.error(`Failed to submit support ticket: ${error.message}`)
      setIsSubmitting(false)
    },
  })

  const onConfirmHandleDelete = () => {
    const payload = {
      subject: 'Account Deletion Request',
      message: 'I want to delete my account.',
      category: 'account_management',
      severity: 'high',
      allowSupportAccess: false,
    }

    console.log(payload)

    setIsSubmitting(true)
    submitSupportTicket(payload)
  }

  const openConfirmationModal = () => {
    setShowDelete(true)
  }

  return (
    <>
      <Panel title={<h5 key="panel-title">Delete account - are you sure?</h5>}>
        <Panel.Content>
          <Button type="danger" onClick={openConfirmationModal} disabled={isLoading}>
            Delete account
          </Button>
        </Panel.Content>
      </Panel>

      <ConfirmationModal
        danger
        size="medium"
        visible={showDelete}
        header="Delete account"
        buttonLabel="Confirm"
        buttonLoadingLabel="Sending request..."
        onSelectConfirm={onConfirmHandleDelete}
        onSelectCancel={() => setShowDelete(false)}
      >
        <Modal.Content>
          <div className="py-6">
            <Alert_Shadcn_ variant="warning">
              <IconAlertTriangle strokeWidth={2} />
              <AlertTitle_Shadcn_>Are You Sure You Want to Delete Your Account?</AlertTitle_Shadcn_>
              <AlertDescription_Shadcn_>
                <ul className="list-disc pl-2 text-sm text-foreground-light space-y-1">
                  <li>Deleting your account is permanent and cannot be undone.</li>
                  <li>
                    Your data will be deleted within 30 days, except we may retain a limited set of
                    data for longer where required or permitted by law.
                  </li>
                </ul>
              </AlertDescription_Shadcn_>
            </Alert_Shadcn_>
          </div>
        </Modal.Content>
      </ConfirmationModal>
    </>
  )
}

export default AccountDeletion
