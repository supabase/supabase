import { useParams } from 'common'
import Link from 'next/link'
import { type ReactNode } from 'react'
import { cn } from 'ui'

interface NotExposedEntitiesIndicatorProps {
  count: number
  /** Singular noun, e.g. "table" or "function" */
  entityNoun: string
  /** Plural noun, e.g. "tables" or "functions" */
  entityNounPlural: string
  /** Optional callback fired when the link is clicked (e.g. to close a panel) */
  onNavigate?: () => void
  /** Overrides the default layout classes (padding/size) — color/hover styling is always applied */
  className?: string
}

/**
 * Quiet link shown beneath a docs entity list when some entities are hidden
 * because they aren't exposed to the Data API. Styled like a dimmer nav item and
 * links to the Data API settings where the user can grant access.
 */
export const NotExposedEntitiesIndicator = ({
  count,
  entityNoun,
  entityNounPlural,
  onNavigate,
  className,
}: NotExposedEntitiesIndicatorProps): ReactNode => {
  const { ref } = useParams()

  if (count <= 0) return null

  const noun = count === 1 ? entityNoun : entityNounPlural

  return (
    <Link
      href={`/project/${ref}/integrations/data_api/settings`}
      onClick={onNavigate}
      className={cn(
        'block text-foreground-lighter transition hover:text-foreground',
        className ?? 'px-4 pt-2 text-sm'
      )}
    >
      {count} {noun} not exposed
    </Link>
  )
}
