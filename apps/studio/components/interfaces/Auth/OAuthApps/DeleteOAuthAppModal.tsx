import type { OAuthClient } from '@supabase/supabase-js'
import { useParams } from 'common'
import { useProjectEndpointQuery } from 'data/config/project-endpoint-query'
import type { OAuthServerAppDeleteVariables } from 'data/oauth-server-apps/oauth-server-app-delete-mutation'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

interface DeleteOAuthAppModalProps {
  visible: boolean
  selectedApp?: OAuthClient
  setVisible: (value: string | null) => void
  onDelete: (params: OAuthServerAppDeleteVariables) => void
  isLoading: boolean
}

export const DeleteOAuthAppModal = ({
  visible,
  selectedApp,
  setVisible,
  onDelete,
  isLoading,
}: DeleteOAuthAppModalProps) => {
  const { ref: projectRef } = useParams()

  const { data: endpointData } = useProjectEndpointQuery({ projectRef })
  const onConfirmDeleteApp = () => {
    onDelete({
      projectRef,
      clientId: selectedApp?.client_id,
      clientEndpoint: endpointData?.endpoint,
    })
  }

  return (
    <ConfirmationModal
      variant={'destructive'}
      size="medium"
      loading={isLoading}
      visible={visible}
      title={
        <>
          Confirm to delete OAuth app{' '}
          <code className="text-code-inline">{selectedApp?.client_name}</code>
        </>
      }
      confirmLabel="Confirm delete"
      confirmLabelLoading="Deleting..."
      onCancel={() => setVisible(null)}
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
