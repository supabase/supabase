import { useParams } from 'common'
import Link from 'next/link'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/admonition'

import { InlineLink } from '@/components/ui/InlineLink'
import { DOCS_URL } from '@/lib/constants'

/**
 * Shown on template list and editor pages when a send-email hook is active.
 * The hook bypasses template rendering entirely — Auth sends event metadata to
 * the hook, not rendered HTML — so templates are irrelevant while it's enabled.
 */
export const SendEmailHookActiveAdmonition = () => {
  const { ref: projectRef } = useParams()

  return (
    <Admonition
      type="default"
      layout="responsive"
      title="Email templates are not used"
      description={
        <>
          A Send Email hook is active. Email data is sent to your hook instead of using these
          templates.{' '}
          <InlineLink href={`${DOCS_URL}/guides/auth/auth-hooks/send-email-hook`}>
            Learn more
          </InlineLink>
        </>
      }
      actions={
        <Button asChild variant="default">
          <Link href={`/project/${projectRef}/auth/hooks?hook=send-email`}>Manage hook</Link>
        </Button>
      }
    />
  )
}
