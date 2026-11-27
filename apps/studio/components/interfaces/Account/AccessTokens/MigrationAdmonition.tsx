import { LOCAL_STORAGE_KEYS } from 'common'
import Link from 'next/link'
import { Badge, Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { DOCS_URL } from '@/lib/constants'

export const MigrationAdmonition = () => {
  const [isDismissed, setIsDismissed] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.SCOPED_TOKENS_MIGRATION_ADMONITION_DISMISSED,
    false
  )

  if (isDismissed) return null

  return (
    <Admonition
      type="default"
      title="Access tokens can now be scoped"
      className="relative mb-5"
      actions={
        <>
          <Button asChild size="tiny">
            <Link
              href={`${DOCS_URL}/guides/platform/personal-access-tokens`}
              target="_blank"
              rel="noreferrer"
            >
              Learn more
            </Link>
          </Button>
          <Button variant="text" onClick={() => setIsDismissed(true)} aria-label="Close">
            Dismiss
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-y-1.5">
        <p className="text-sm text-foreground-light">
          Choose which organizations and projects each new token can reach, and what it can do
          there. Grant only what its integration needs.
        </p>
        <span className="text-sm text-foreground-light">
          Tokens with full account access show a <Badge>Legacy</Badge> badge and keep working until
          they expire or you delete them.
        </span>
      </div>
    </Admonition>
  )
}
