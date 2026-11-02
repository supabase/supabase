import { InterstitialTerminalScreen } from '../InterstitialTerminalScreen'
import type { SecretsState } from './McpSecrets.types'
import { getSecretsCopy } from './McpSecrets.utils'
import { McpSecretsForm } from './McpSecretsForm'
import { McpSecretsSkeleton } from './McpSecretsSkeleton'
import { McpSecretsWrongAccount } from './McpSecretsWrongAccount'

export const McpSecretsCard = ({
  state,
  isSaving,
  onSave,
  onCancel,
  onSwitchAccount,
}: {
  state: SecretsState
  isSaving: boolean
  onSave: (secret: string) => void
  onCancel: () => void
  onSwitchAccount: () => void
}) => {
  if (state.status === 'loading') return <McpSecretsSkeleton />

  if (state.status === 'form') {
    return (
      <McpSecretsForm
        key={`${state.request.ref}:${state.request.keyName}`}
        request={state.request}
        isSaving={isSaving}
        onSave={onSave}
        onCancel={onCancel}
      />
    )
  }

  if (state.status === 'wrong-account') {
    return (
      <McpSecretsWrongAccount signedInAs={state.signedInAs} onSwitchAccount={onSwitchAccount} />
    )
  }

  return <InterstitialTerminalScreen {...getSecretsCopy(state)} />
}
