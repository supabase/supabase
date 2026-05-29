import { useParams } from 'common'
import { EyeOff } from 'lucide-react'
import { type ReactNode } from 'react'

import { InlineLink } from '@/components/ui/InlineLink'
import { useAppStateSnapshot } from '@/state/app-state'

interface NotExposedEntitiesIndicatorProps {
  count: number
  /** Singular noun, e.g. "table" or "function" */
  entityNoun: string
  /** Plural noun, e.g. "tables" or "functions" */
  entityNounPlural: string
}

/**
 * Footer shown beneath a docs entity list when some entities are hidden because
 * they aren't exposed to the Data API. Links to the Data API settings where the
 * user can grant access, closing the docs panel on navigation.
 */
export const NotExposedEntitiesIndicator = ({
  count,
  entityNoun,
  entityNounPlural,
}: NotExposedEntitiesIndicatorProps): ReactNode => {
  const { ref } = useParams()
  const snap = useAppStateSnapshot()

  if (count <= 0) return null

  const noun = count === 1 ? entityNoun : entityNounPlural

  return (
    <div className="flex gap-x-2 px-4 pt-2 text-xs text-foreground-lighter">
      <EyeOff size={14} strokeWidth={1.5} className="mt-px shrink-0" />
      <p>
        {count} {noun} not exposed via{' '}
        <InlineLink
          href={`/project/${ref}/integrations/data_api/settings`}
          onClick={() => snap.setShowProjectApiDocs(false)}
        >
          Data API
        </InlineLink>
      </p>
    </div>
  )
}
