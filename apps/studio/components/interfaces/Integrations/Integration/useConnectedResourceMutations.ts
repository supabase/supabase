import { defaultDisabledSmtpFormValues } from '@/components/interfaces/Auth/SmtpForm/SmtpForm.constants'
import { type ConnectedResource } from '@/components/interfaces/Integrations/Landing/Landing.utils'
import { useAPIKeyDeleteMutation } from '@/data/api-keys/api-key-delete-mutation'
import { useAuthConfigUpdateMutation } from '@/data/auth/auth-config-update-mutation'
import { useAuthorizedAppRevokeMutation } from '@/data/oauth/authorized-app-revoke-mutation'
import { useSecretsDeleteMutation } from '@/data/secrets/secrets-delete-mutation'

/**
 * Combines the four mutations used to remove a connected resource (OAuth app, secret API key,
 * Edge Function secret, custom SMTP) into a single hook. The component only needs to dispatch a
 * removal and read an aggregated loading state, rather than wiring up each mutation individually.
 */
export const useConnectedResourceMutations = ({
  projectRef,
  orgSlug,
  onSuccess,
}: {
  projectRef?: string
  orgSlug?: string
  onSuccess?: () => void
}) => {
  const { mutateAsync: revokeAuthorizedApp, isPending: isRevokingApp } =
    useAuthorizedAppRevokeMutation({ onSuccess })
  const { mutateAsync: deleteAPIKey, isPending: isDeletingApiKey } = useAPIKeyDeleteMutation({
    onSuccess,
  })
  const { mutateAsync: deleteSecrets, isPending: isDeletingSecret } = useSecretsDeleteMutation({
    onSuccess,
  })
  const { mutateAsync: updateAuthConfig, isPending: isUpdatingAuthConfig } =
    useAuthConfigUpdateMutation({ onSuccess })

  /** Dispatches the correct mutation for a given resource based on its kind. */
  const removeResource = async (resource: ConnectedResource) => {
    switch (resource.kind) {
      case 'oauth_app':
        if (!orgSlug) throw new Error('Organization is required')
        return revokeAuthorizedApp({ orgSlug, id: resource.app.id })
      case 'api_key':
        if (!projectRef) throw new Error('Project is required')
        return deleteAPIKey({ projectRef, id: resource.apiKey.id! })
      case 'edge_function_secret':
        if (!projectRef) throw new Error('Project is required')
        return deleteSecrets({ projectRef, secrets: [resource.secret.name] })
      case 'smtp':
        if (!projectRef) throw new Error('Project is required')
        return updateAuthConfig({ projectRef, config: defaultDisabledSmtpFormValues })
    }
  }

  return {
    removeResource,
    isRemoving: isRevokingApp || isDeletingApiKey || isDeletingSecret || isUpdatingAuthConfig,
  }
}
