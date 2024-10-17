import Link from 'next/link'

import { useParams } from 'common'
import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, WarningIcon } from 'ui'

export function EmailRateLimitsAlert() {
  const { ref: projectRef } = useParams()
  const after20240926 = Date.now() >= new Date('20240926T00:00:00Z').getTime()

  return (
    <Alert_Shadcn_ variant="warning">
      <WarningIcon />
      <AlertTitle_Shadcn_>Email rate-limits and restrictions</AlertTitle_Shadcn_>
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
        for an up-to-date information on the current rate limits.{' '}
        <Link
          className="underline"
          target="_blank"
          href={`/project/${projectRef}/settings/auth#auth-config-smtp-form`}
        >
          Set up a custom SMTP server now.
        </Link>
      </AlertDescription_Shadcn_>
      <AlertDescription_Shadcn_ className="mt-2">
        {after20240926
          ? 'To fight abuse, Auth email messages are restricted '
          : 'On 26th September: To fight abuse, Auth email messages will be restricted '}
        to your project's organization members. For example, if your organization has 3 members with
        addresses: <code>person-a@example.com</code>, <code>person-b@example.com</code> and{' '}
        <code>person-c@example.com</code>, messages will be{' '}
        <strong>sent to those addresses only.</strong> Set up custom SMTP to send to any user.
      </AlertDescription_Shadcn_>
    </Alert_Shadcn_>
  )
}
