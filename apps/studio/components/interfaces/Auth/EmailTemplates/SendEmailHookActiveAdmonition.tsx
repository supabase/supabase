import { useParams } from 'common'
import Link from 'next/link'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/admonition'

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
      description="A Send Email hook is active. Event metadata is passed directly to your hook, meaning these templates are bypassed entirely."
      actions={
        <Button asChild type="default">
          <Link href={`/project/${projectRef}/auth/hooks?hook=send-email`}>Manage hook</Link>
        </Button>
      }
    />
  )
}
