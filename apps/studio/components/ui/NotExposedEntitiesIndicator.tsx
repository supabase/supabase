import { useParams } from 'common'
import { EyeOff } from 'lucide-react'
import { type ReactNode } from 'react'
import { cn } from 'ui'

import { InlineLink } from '@/components/ui/InlineLink'

interface NotExposedEntitiesIndicatorProps {
  count: number
  /** Singular noun, e.g. "table" or "function" */
  entityNoun: string
  /** Plural noun, e.g. "tables" or "functions" */
  entityNounPlural: string
  /** Optional callback fired when the settings link is clicked (e.g. to close a panel) */
  onNavigate?: () => void
  /** Overrides the default layout classes (padding) — inner flex/text styling is always applied */
  className?: string
}

/**
 * Footer shown beneath a docs entity list when some entities are hidden because
 * they aren't exposed to the Data API. Links to the Data API settings where the
 * user can grant access.
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
    <div className={cn('flex gap-x-2 text-xs text-foreground-lighter', className ?? 'px-4 pt-2')}>
      <EyeOff size={14} strokeWidth={1.5} className="mt-px shrink-0" />
      <p>
        {count} {noun} not exposed via{' '}
        <InlineLink href={`/project/${ref}/integrations/data_api/settings`} onClick={onNavigate}>
          Data API
        </InlineLink>
      </p>
    </div>
  )
}
