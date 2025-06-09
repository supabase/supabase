import { Alert_Shadcn_, AlertDescription_Shadcn_, AlertTitle_Shadcn_, Badge, Toggle } from 'ui'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { X } from 'lucide-react'
import { toast } from 'sonner'

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
        We’ve updated our{' '}
        <a href="https://supabase.com/privacy" target="_blank" className="text hover:text-brand">
          Privacy Policy
        </a>{' '}
        to clarify how we use AI features, marketing tools, cookies, and your data. By continuing to
        use Supabase after May 28, you agree to the new terms. Questions? Contact{' '}
        <a href="mailto:privacy@supabase.com" target="_blank" className="text hover:text-brand">
          our team
        </a>
        .
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
