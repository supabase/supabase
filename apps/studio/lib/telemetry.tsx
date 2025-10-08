import { PageTelemetry } from 'common'
import { API_URL, IS_PLATFORM } from 'lib/constants'
import { useConsentToast } from 'ui-patterns/consent'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'

export function Telemetry() {
  // Although this is "technically" breaking the rules of hooks
  // IS_PLATFORM never changes within a session, so this won't cause any issues
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { hasAcceptedConsent } = IS_PLATFORM ? useConsentToast() : { hasAcceptedConsent: true }

  // Get org from selected organization query because it's not
  // always available in the URL params
  const { data: organization } = useSelectedOrganizationQuery()

  return (
    <PageTelemetry
      API_URL={API_URL}
      hasAcceptedConsent={hasAcceptedConsent}
      enabled={IS_PLATFORM}
      organizationSlug={organization?.slug}
    />
  )
}
