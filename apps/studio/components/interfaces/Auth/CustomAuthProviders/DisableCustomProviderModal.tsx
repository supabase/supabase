import type { CustomOAuthProvider } from '@supabase/auth-js'
import { useParams } from 'common'
import { toast } from 'sonner'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import { useProjectApiUrl } from '@/data/config/project-endpoint-query'
import { useOAuthCustomProviderUpdateMutation } from '@/data/oauth-custom-providers/oauth-custom-provider-update-mutation'

interface DisableCustomProviderModalProps {
  visible: boolean
  selectedProvider?: CustomOAuthProvider
  onClose: () => void
}

export const DisableCustomProviderModal = ({
  visible,
  selectedProvider,
  onClose,
}: DisableCustomProviderModalProps) => {
  const { ref: projectRef } = useParams()
  const { hostEndpoint: clientEndpoint } = useProjectApiUrl({ projectRef })
  const { mutate, isPending } = useOAuthCustomProviderUpdateMutation({
    onSuccess: () => {
      toast.success('Custom provider disabled')
      onClose()
    },
  })

  const onConfirmDisable = () => {
    mutate({
      identifier: selectedProvider?.identifier,
      projectRef,
      clientEndpoint,
      enabled: false,
    })
  }

  return (
    <ConfirmationModal
      variant="warning"
      size="medium"
      loading={isPending}
      visible={visible}
      title={
        <>
          Confirm to disable custom provider{' '}
          <code className="text-sm">{selectedProvider?.name}</code>
        </>
      }
      confirmLabel="Confirm disable"
      confirmLabelLoading="Disabling..."
      onCancel={() => onClose()}
      onConfirm={() => onConfirmDisable()}
      alert={{
        title: 'Users will not be able to sign in with this provider',
        description:
          'You can re-enable it at any time. Existing sessions are not affected, but new sign-ins will fail until the provider is re-enabled.',
      }}
    >
      <p className="text-sm">Before disabling this custom provider, consider:</p>
      <ul className="space-y-2 mt-2 text-sm text-foreground-light">
        <li className="list-disc ml-6">
          Users authenticating with this provider will be unable to sign in
        </li>
        <li className="list-disc ml-6">
          Applications relying on this provider should be updated or paused
        </li>
      </ul>
    </ConfirmationModal>
  )
}
