import type { ElicitationState } from './McpElicitation.types'
import { McpElicitationForm } from './McpElicitationForm'
import { McpElicitationOutcome } from './McpElicitationOutcome'
import { McpElicitationSkeleton } from './McpElicitationSkeleton'
import { McpElicitationWrongAccount } from './McpElicitationWrongAccount'

/**
 * Renders a resolved `ElicitationState`. Knows nothing about the URL, the
 * queries, or where the state came from.
 */
export const McpElicitationCard = ({
  state,
  isSaving,
  onSave,
  onCancel,
  onSwitchAccount,
}: {
  state: ElicitationState
  isSaving: boolean
  onSave: (secret: string) => void
  onCancel: () => void
  onSwitchAccount: () => void
}) => {
  if (state.status === 'loading') return <McpElicitationSkeleton />

  if (state.status === 'form') {
    return (
      <McpElicitationForm
        request={state.request}
        isSaving={isSaving}
        onSave={onSave}
        onCancel={onCancel}
      />
    )
  }

  if (state.status === 'wrong-account') {
    return (
      <McpElicitationWrongAccount signedInAs={state.signedInAs} onSwitchAccount={onSwitchAccount} />
    )
  }

  return <McpElicitationOutcome state={state} />
}
