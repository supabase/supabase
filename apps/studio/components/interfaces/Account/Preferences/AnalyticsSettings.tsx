import { Toggle } from 'ui'

import { useConsentState } from 'common'
import Panel from 'components/ui/Panel'
import { useSendResetMutation } from 'data/telemetry/send-reset-mutation'

export const AnalyticsSettings = () => {
  const { hasAccepted, acceptAll, denyAll } = useConsentState()
  const { mutate: sendReset } = useSendResetMutation()

  const onToggleOptIn = () => {
    if (hasAccepted) {
      denyAll()
      sendReset()
    } else {
      acceptAll()
    }
  }

  return (
    <Panel title={<h5 key="panel-title">Analytics and Marketing</h5>}>
      <Panel.Content>
        <Toggle
          checked={hasAccepted}
          onChange={onToggleOptIn}
          label="Send telemetry data from Supabase services"
          descriptionText="By opting in to sharing telemetry data, Supabase can analyze usage patterns to enhance user experience and use it for marketing and advertising purposes"
        />
      </Panel.Content>
    </Panel>
  )
}
