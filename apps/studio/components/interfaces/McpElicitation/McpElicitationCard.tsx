import type { ElicitationState } from './McpElicitation.types'
import { getElicitationAnnouncement } from './McpElicitation.utils'
import { McpElicitationForm } from './McpElicitationForm'
import { McpElicitationOutcome } from './McpElicitationOutcome'
import { McpElicitationSkeleton } from './McpElicitationSkeleton'
import { McpElicitationWrongAccount } from './McpElicitationWrongAccount'

type McpElicitationCardProps = {
  state: ElicitationState
  isSaving: boolean
  onSave: (secret: string) => void
  onCancel: () => void
  onSwitchAccount: () => void
}

export const McpElicitationCard = (props: McpElicitationCardProps) => (
  <>
    <p role="status" aria-live="polite" className="sr-only">
      {getElicitationAnnouncement(props.state)}
    </p>
    <McpElicitationCardContent {...props} />
  </>
)

const McpElicitationCardContent = ({
  state,
  isSaving,
  onSave,
  onCancel,
  onSwitchAccount,
}: McpElicitationCardProps) => {
  if (state.status === 'loading') return <McpElicitationSkeleton />

  if (state.status === 'form') {
    return (
      <McpElicitationForm
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
      <McpElicitationWrongAccount signedInAs={state.signedInAs} onSwitchAccount={onSwitchAccount} />
    )
  }

  return <McpElicitationOutcome state={state} />
}
