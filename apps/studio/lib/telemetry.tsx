import { PageTelemetry, TelemetryTagManager } from 'common'
import GroupsTelemetry from 'components/ui/GroupsTelemetry'
import { API_URL, IS_PLATFORM } from 'lib/constants'
import { useRouter } from 'next/router'
import { useConsentToast } from 'ui-patterns/consent'

export function Telemetry() {
  // Although this is "technically" breaking the rules of hooks
  // IS_PLATFORM never changes within a session, so this won't cause any issues
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { hasAcceptedConsent } = IS_PLATFORM ? useConsentToast() : { hasAcceptedConsent: true }
  const { pathname } = useRouter()

  return (
    <>
      <PageTelemetry
        API_URL={API_URL}
        hasAcceptedConsent={hasAcceptedConsent}
        enabled={IS_PLATFORM}
      />
      <GroupsTelemetry hasAcceptedConsent={hasAcceptedConsent} />
      <TelemetryTagManager isGTMEnabled={IS_PLATFORM && pathname === '/sign-up'} />
    </>
  )
}
