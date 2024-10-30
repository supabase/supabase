import { ExternalLink } from 'lucide-react'
import { useRouter } from 'next/router'

import { useParams } from 'common'
import { useAppBannerContext } from 'components/interfaces/App/AppBannerWrapperContext'
import { useProfile } from 'lib/profile'
import { Button } from 'ui'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { isSmtpEnabled } from 'components/interfaces/Auth/SmtpForm/SmtpForm.utils'

// This file, like AppBannerWrapperContext.tsx, is meant to be dynamic - update this as and when we need to use the NoticeBanner

// [Joshen] As of 19th September 24, this notice is around custom SMTP
// https://github.com/orgs/supabase/discussions/29370
// Timelines TLDR:
// - 20th September 2024: Email template customization no longer possible without setting up custom SMTP provider
// - 24th September 2024: Projects without custom SMTP will have their custom email templates returned back to default ones
// - 26th September 2024: If no custom SMTP, emails can only be sent to email addresses in your project's organization
// We can probably look to disable this banner perhaps a month from 26th Sept 2024 - so maybe end of October 2024

export const NoticeBanner = () => {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const { isLoading: isLoadingProfile } = useProfile()

  const appBannerContext = useAppBannerContext()
  const { authSmtpBannerAcknowledged, onUpdateAcknowledged } = appBannerContext

  const { data: authConfig } = useAuthConfigQuery({ projectRef })
  const smtpEnabled = isSmtpEnabled(authConfig)
  const hasAuthEmailHookEnabled = authConfig?.HOOK_SEND_EMAIL_ENABLED

  const acknowledged = authSmtpBannerAcknowledged.includes(projectRef ?? '')

  if (
    isLoadingProfile ||
    router.pathname.includes('sign-in') ||
    smtpEnabled ||
    hasAuthEmailHookEnabled ||
    acknowledged
  ) {
    return null
  }

  return (
    <div
      style={{ height: '44px' }}
      className="flex items-center justify-center gap-x-4 bg-surface-100 py-3 transition text-foreground box-border border-b border-default"
    >
      <p className="text-sm">
        Action required: Set up a custom SMTP provider, further restrictions will be imposed for the
        default email provider
      </p>
      <div className="flex items-center gap-x-1">
        <Button asChild type="link" iconRight={<ExternalLink size={14} />}>
          <a
            target="_blank"
            rel="noreferrer"
            href="https://github.com/orgs/supabase/discussions/29370"
          >
            Learn more
          </a>
        </Button>
        <Button
          type="text"
          className="opacity-75"
          onClick={() => {
            if (projectRef) onUpdateAcknowledged('auth-smtp', projectRef)
          }}
        >
          Dismiss
        </Button>
      </div>
    </div>
  )
}
