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

/**
 * Renders a resolved `ElicitationState`. Knows nothing about the URL, the
 * queries, or where the state came from.
 *
 * The live region is a sibling of the card rather than part of it: each status
 * below replaces the whole card, so a region inside any branch would unmount on
 * the very transition it exists to announce.
 */
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
