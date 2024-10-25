import { Toggle } from 'ui'

import Panel from 'components/ui/Panel'
import { useSendResetMutation } from 'data/telemetry/send-reset-mutation'
import { useAppStateSnapshot } from 'state/app-state'

const AnalyticsSettings = () => {
  const snap = useAppStateSnapshot()
  const { mutate: sendReset } = useSendResetMutation()

  const onToggleOptIn = () => {
    const value = !snap.isOptedInTelemetry ? 'true' : 'false'
    snap.setIsOptedInTelemetry(value === 'true')
    if (value === 'false') sendReset()
  }

  return (
    <Panel title={<h5 key="panel-title">Analytics</h5>}>
      <Panel.Content>
        <Toggle
          checked={snap.isOptedInTelemetry}
          onChange={onToggleOptIn}
          label="Opt-in to send telemetry data from the dashboard"
          descriptionText="By opting into sending telemetry data, Supabase can improve the overall dashboard user experience"
        />
      </Panel.Content>
    </Panel>
  )
}

export default AnalyticsSettings
