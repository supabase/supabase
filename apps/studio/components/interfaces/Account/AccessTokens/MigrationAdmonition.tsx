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
      title="We're moving to scoped access tokens"
      className="relative mb-5"
      actions={
        <>
          {/* Awaiting correct documentation link */}
          <Button asChild variant="default" size="tiny">
            <Link href={`${DOCS_URL}/guides/api`} target="_blank" rel="noreferrer">
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
          We recommend granting each new token the minimum access its integration needs.
        </p>
        <span className="text-sm text-foreground-light">
          Pre-existing tokens are marked with a <Badge>Legacy</Badge> badge and will continue to
          work until expiry or deletion.
        </span>
      </div>
    </Admonition>
  )
}
