import Link from 'next/link'

import { useParams } from 'common'
import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, WarningIcon } from 'ui'

export function EmailRateLimitsAlert() {
  const { ref: projectRef } = useParams()

  return (
    <Alert_Shadcn_ variant="warning">
      <WarningIcon />
      <AlertTitle_Shadcn_>Email rate-limits and template changes</AlertTitle_Shadcn_>
      <AlertDescription_Shadcn_>
        You're using the built-in email service. The service has rate limits and it's not meant to
        be used for production apps. Check the{' '}
        <a
          href="https://supabase.com/docs/guides/platform/going-into-prod#auth-rate-limits"
          className="underline"
          target="_blank"
        >
          documentation
        </a>{' '}
        for an up-to-date information on the current rate limits. Please use a{' '}
        <Link
          className="underline"
          target="_blank"
          href={`/project/${projectRef}/settings/auth#auth-config-smtp-form`}
        >
          custom SMTP server
        </Link>
        .<br />
        <strong>
          You will not be able to modify the email templates unless you've set up a custom SMTP
          server or Send Email Hook server, except if you had changed it before this restriction
          went into effect.
        </strong>
      </AlertDescription_Shadcn_>
    </Alert_Shadcn_>
  )
}
