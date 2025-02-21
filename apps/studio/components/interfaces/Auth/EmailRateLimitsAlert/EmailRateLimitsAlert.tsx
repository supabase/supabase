import Link from 'next/link'

import { useParams } from 'common'
import { InlineLink } from 'components/ui/InlineLink'
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
        <InlineLink href="https://supabase.com/docs/guides/platform/going-into-prod#auth-rate-limits">
          documentation
        </InlineLink>{' '}
        for an up-to-date information on the current rate limits.
      </AlertDescription_Shadcn_>
      <AlertDescription_Shadcn_ className="mt-2">
        <Button asChild type="default">
          <Link href={`/project/${ref}/auth/smtp`}>Set up custom SMTP server</Link>
        </Button>
      </AlertDescription_Shadcn_>
    </Alert_Shadcn_>
  )
}
