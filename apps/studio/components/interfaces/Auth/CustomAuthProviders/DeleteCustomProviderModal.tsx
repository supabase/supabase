import type { CustomOAuthProvider } from '@supabase/auth-js'
import { useParams } from 'common'
import { toast } from 'sonner'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import { useProjectApiUrl } from '@/data/config/project-endpoint-query'
import { useOAuthCustomProviderDeleteMutation } from '@/data/oauth-custom-providers/oauth-custom-provider-delete-mutation'

interface DeleteCustomProviderModalProps {
  visible: boolean
  selectedProvider?: CustomOAuthProvider
  onClose: () => void
}

export const DeleteCustomProviderModal = ({
  visible,
  selectedProvider,
  onClose,
}: DeleteCustomProviderModalProps) => {
  const { ref: projectRef } = useParams()
  const { hostEndpoint: clientEndpoint } = useProjectApiUrl({ projectRef })
  const { mutate, isPending } = useOAuthCustomProviderDeleteMutation({
    onSuccess: () => {
      toast.success('Custom provider deleted successfully')
      onClose()
    },
  })

  const onConfirmDelete = () => {
    mutate({
      identifier: selectedProvider?.identifier,
      projectRef,
      clientEndpoint,
    })
  }

  return (
    <ConfirmationModal
      variant="destructive"
      size="medium"
      loading={isPending}
      visible={visible}
      title={
        <>
          Confirm to delete custom provider{' '}
          <code className="text-sm">{selectedProvider?.name}</code>
        </>
      }
      confirmLabel="Confirm delete"
      confirmLabelLoading="Deleting..."
      onCancel={() => onClose()}
      onConfirm={() => onConfirmDelete()}
      alert={{
        title: 'This action cannot be undone',
        description:
          'You will need to re-create the custom provider if you want to revert the deletion.',
      }}
    >
      <p className="text-sm">Before deleting this custom provider, consider:</p>
      <ul className="space-y-2 mt-2 text-sm text-foreground-light">
        <li className="list-disc ml-6">
          Any users authenticating with this provider will lose access
        </li>
        <li className="list-disc ml-6">This provider is no longer in use by any applications</li>
      </ul>
    </ConfirmationModal>
  )
}
