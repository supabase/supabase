import { LOCAL_STORAGE_KEYS } from 'common'
import { X } from 'lucide-react'
import Link from 'next/link'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/admonition'

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
      className="relative"
      actions={
        <Button
          variant="text"
          icon={<X />}
          className="absolute right-2.5 top-2.5 h-7 w-7"
          onClick={() => setIsDismissed(true)}
        />
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-foreground-light">
          Your existing classic tokens keep working. New tokens are now scoped — we recommend
          granting each token the minimum access its integration needs.
        </p>
        <Button asChild variant="default" size="tiny">
          {/* TODO: replace with the scoped tokens docs route once published */}
          <Link href={`${DOCS_URL}/guides/api`} target="_blank" rel="noreferrer">
            Learn more
          </Link>
        </Button>
      </div>
    </Admonition>
  )
}
