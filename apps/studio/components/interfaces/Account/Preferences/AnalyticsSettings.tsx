import { toast } from 'sonner'

import { useConsentState } from 'common'
import Panel from 'components/ui/Panel'
import { useSendResetMutation } from 'data/telemetry/send-reset-mutation'
import { Toggle } from 'ui'

export const AnalyticsSettings = () => {
  const { hasAccepted, acceptAll, denyAll, categories } = useConsentState()
  const hasLoaded = categories !== null

  const { mutate: sendReset } = useSendResetMutation()

  const onToggleOptIn = () => {
    if (!hasLoaded) {
      toast.error(
        "We couldn't load the privacy settings due to an ad blocker or network error. Please disable any ad blockers and try again. If the problem persists, please contact support."
      )
      return
    }

    if (hasAccepted) {
      denyAll()
      sendReset()
    } else {
      acceptAll()
    }
  }

  return (
    <Panel title={<h5 key="panel-title">Analytics</h5>}>
      <Panel.Content>
        <Toggle
          checked={hasAccepted}
          onChange={onToggleOptIn}
          label="Opt-in to send telemetry data from the dashboard"
          descriptionText="By opting into sending telemetry data, Supabase can improve the overall dashboard user experience"
        />
      </Panel.Content>
    </Panel>
  )
}
