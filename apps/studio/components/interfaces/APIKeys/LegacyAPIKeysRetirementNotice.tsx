import { useParams } from 'common'
import Link from 'next/link'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import { DocsButton } from '@/components/ui/DocsButton'
import { useHighAvailability } from '@/hooks/misc/useHighAvailability'
import { DOCS_URL } from '@/lib/constants'

export const LegacyAPIKeysRetirementNotice = () => {
  const { ref: projectRef } = useParams()
  const { isHighAvailability } = useHighAvailability()

  if (isHighAvailability) return null

  return (
    <Admonition
      type="default"
      layout="responsive"
      title="Legacy API keys will be retired in early 2027"
      description="Migrate to publishable and secret API keys to avoid disruption."
      actions={
        <>
          <Button asChild variant="default">
            <Link href={`/project/${projectRef}/settings/api-keys/legacy`}>
              View legacy API keys
            </Link>
          </Button>
          <DocsButton
            href={`${DOCS_URL}/guides/getting-started/migrating-to-new-api-keys`}
            label="Migration guide"
            topic="Migrating to new API keys"
          />
        </>
      }
    />
  )
}
