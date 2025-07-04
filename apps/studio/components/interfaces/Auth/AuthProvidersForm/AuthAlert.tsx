import { ExternalLink } from 'lucide-react'
import Link from 'next/link'

import { useParams } from 'common'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Button,
  WarningIcon,
} from 'ui'

export const AuthAlert = ({
  title,
  isHookSendSMSEnabled,
}: {
  title: string
  isHookSendSMSEnabled: boolean
}) => {
  const { ref } = useParams()

  switch (title) {
    // TODO (KM): Remove after 10th October 2024 when we disable the provider
    case 'Slack (Deprecated)':
      return (
        <Alert_Shadcn_ variant="warning">
          <WarningIcon />
          <AlertTitle_Shadcn_>Slack (Deprecated) Provider</AlertTitle_Shadcn_>
          <AlertDescription_Shadcn_>
            Recently, Slack has updated their OAuth API. Please use the new Slack (OIDC) provider
            below. Developers using this provider should move over to the new provider. Please refer
            to our{' '}
            <a
              href="https://supabase.com/docs/guides/auth/social-login/auth-slack"
              className="underline"
              target="_blank"
            >
              documentation
            </a>{' '}
            for more details.
          </AlertDescription_Shadcn_>
        </Alert_Shadcn_>
      )
    case 'Phone':
      return (
        isHookSendSMSEnabled && (
          <Alert_Shadcn_>
            <WarningIcon />
            <AlertTitle_Shadcn_>
              SMS provider settings are disabled while the SMS hook is enabled.
            </AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_ className="flex flex-col gap-y-3">
              <p>The SMS hook will be used in place of the SMS provider configured</p>
              <Button asChild type="default" className="w-min" icon={<ExternalLink />}>
                <Link href={`/project/${ref}/auth/hooks`}>View auth hooks</Link>
              </Button>
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>
        )
      )
    default:
      return null
  }
}
