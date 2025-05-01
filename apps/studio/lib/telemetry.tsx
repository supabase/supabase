import { PageTelemetry } from 'common'
import GroupsTelemetry from 'components/ui/GroupsTelemetry'
import { API_URL, IS_PLATFORM } from 'lib/constants'
import { useConsentToast } from 'ui-patterns/consent'

export function Telemetry() {
  // Although this is "technically" breaking the rules of hooks
  // IS_PLATFORM never changes within a session, so this won't cause any issues
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { hasAcceptedConsent } = IS_PLATFORM ? useConsentToast() : { hasAcceptedConsent: true }

  return (
    <>
      <PageTelemetry
        API_URL={API_URL}
        hasAcceptedConsent={hasAcceptedConsent}
        enabled={IS_PLATFORM}
      />
      <GroupsTelemetry hasAcceptedConsent={hasAcceptedConsent} />
    </>
  )
}
