import Link from 'next/link'

import { useParams } from 'common'
import { InlineLink } from 'components/ui/InlineLink'
import { DOCS_URL } from 'lib/constants'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/admonition'

export const EmailRateLimitsAlert = () => {
  const { ref } = useParams()

  return (
    <Admonition type="warning" title="Set up custom SMTP">
      <p>
        You’re using the built-in email service. This service has rate limits and is not meant to be
        used for production apps.{' '}
        <InlineLink href={`${DOCS_URL}/guides/platform/going-into-prod#auth-rate-limits`}>
          Learn more
        </InlineLink>{' '}
      </p>
      <Button asChild type="default" className="mt-2">
        <Link href={`/project/${ref}/auth/smtp`}>Set up SMTP</Link>
      </Button>
    </Admonition>
  )
}
