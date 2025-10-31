import type { OAuthClient } from '@supabase/supabase-js'
import { useParams } from 'common'
import { useOAuthServerAppDeleteMutation } from 'data/oauth-server-apps/oauth-server-app-delete-mutation'
import { useSupabaseClientQuery } from 'hooks/use-supabase-client-query'
import { useState } from 'react'
import { toast } from 'sonner'

import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

interface DeleteOAuthAppModalProps {
  visible: boolean
  selectedApp?: OAuthClient
  onClose: () => void
}

export const DeleteOAuthAppModal = ({
  visible,
  selectedApp,
  onClose,
}: DeleteOAuthAppModalProps) => {
  const { ref: projectRef } = useParams()
  const [isDeleting, setIsDeleting] = useState(false)

  const { data: supabaseClientData } = useSupabaseClientQuery({ projectRef })

  const { mutateAsync: deleteOAuthApp } = useOAuthServerAppDeleteMutation()

  const onConfirmDeleteApp = async () => {
    if (!selectedApp) return console.error('No OAuth app selected')

    setIsDeleting(true)

    try {
      await deleteOAuthApp({
        projectRef,
        supabaseClient: supabaseClientData?.supabaseClient,
        clientId: selectedApp.client_id,
      })

      toast.success(`Successfully deleted OAuth app "${selectedApp.client_name}"`)
      onClose()
    } catch (error) {
      toast.error('Failed to delete OAuth app')
      console.error('Error deleting OAuth app:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <ConfirmationModal
      variant={'destructive'}
      size="medium"
      loading={isDeleting}
      visible={visible}
      title={
        <>
          Confirm to delete OAuth app <code className="text-sm">{selectedApp?.client_name}</code>
        </>
      }
      confirmLabel="Confirm delete"
      confirmLabelLoading="Deleting..."
      onCancel={onClose}
      onConfirm={() => onConfirmDeleteApp()}
      alert={{
        title: 'This action cannot be undone',
        description: 'You will need to re-create the OAuth app if you want to revert the deletion.',
      }}
    >
      <p className="text-sm">Before deleting this OAuth app, consider:</p>
      <ul className="space-y-2 mt-2 text-sm text-foreground-light">
        <li className="list-disc ml-6">Any applications using this OAuth app will lose access</li>
        <li className="list-disc ml-6">This OAuth app is no longer in use by any applications</li>
      </ul>
    </ConfirmationModal>
  )
}
