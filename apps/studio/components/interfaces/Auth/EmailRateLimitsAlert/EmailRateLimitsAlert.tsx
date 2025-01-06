import Link from 'next/link'

import { useParams } from 'common'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  WarningIcon,
} from 'ui'

export function EmailRateLimitsAlert() {
  const { ref } = useParams()

  return (
    <Alert_Shadcn_ variant="warning">
      <WarningIcon />
      <AlertTitle_Shadcn_>Email rate-limits and restrictions</AlertTitle_Shadcn_>
      <AlertDescription_Shadcn_>
        You're using the built-in email service. The service has rate limits and it's not meant to
        be used for production apps. Check the{' '}
        {/* [Refactor] Swap for InlineLink component once https://github.com/supabase/supabase/pull/30494 is in */}
        <a
          href="https://supabase.com/docs/guides/platform/going-into-prod#auth-rate-limits"
          className="underline"
          target="_blank"
          rel="noreferrer noopener"
        >
          documentation
        </a>{' '}
        for an up-to-date information on the current rate limits.
        <Button asChild type="default" className="mt-2">
          <Link target="_blank" href={`/project/${ref}/settings/auth#auth-config-smtp-form`}>
            Set up custom SMTP server
          </Link>
        </Button>
      </AlertDescription_Shadcn_>
    </Alert_Shadcn_>
  )
}
