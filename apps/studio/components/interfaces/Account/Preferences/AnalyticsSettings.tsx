import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Badge,
  Button,
  Toggle,
} from 'ui'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { ExternalLink, X } from 'lucide-react'

import { useConsentState } from 'common'
import Panel from 'components/ui/Panel'
import { useSendResetMutation } from 'data/telemetry/send-reset-mutation'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { LOCAL_STORAGE_KEYS } from 'common/constants/local-storage'

export const PrivacyUpdateBanner = () => {
  const [privacyUpdateAcknowledged, setPrivacyUpdateAcknowledged] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.PRIVACY_NOTICE_ACKNOWLEDGED,
    false
  )

  if (privacyUpdateAcknowledged) return null

  return (
    <Alert_Shadcn_ className="mb-4 relative">
      <AlertTitle_Shadcn_>
        <Badge variant="default" className="mr-2">
          NOTICE
        </Badge>
        Privacy Policy Update – Effective May 28, 2025
      </AlertTitle_Shadcn_>
      <AlertDescription_Shadcn_>
        We’ve updated our Privacy Policy to clarify how we use AI features, marketing tools,
        cookies, and your data. By continuing to use Supabase after May 28, you agree to the new
        terms. Questions? Contact{' '}
        <a href="mailto:privacy@supabase.com" target="_blank" className="text hover:text-brand">
          our team
        </a>
        .
      </AlertDescription_Shadcn_>
      <AlertDescription_Shadcn_ className="mt-4 flex items-center gap-x-2">
        <Button asChild type="default" icon={<ExternalLink />}>
          <a target="_blank" rel="noreferrer noopener" href="https://supabase.com/privacy">
            View updated policy
          </a>
        </Button>
      </AlertDescription_Shadcn_>
      <ButtonTooltip
        type="text"
        icon={<X />}
        className="absolute top-2 right-2 px-1"
        onClick={() => setPrivacyUpdateAcknowledged(true)}
        tooltip={{ content: { side: 'bottom', text: 'Dismiss' } }}
      />
    </Alert_Shadcn_>
  )
}

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
