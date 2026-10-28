import type { ReactNode } from 'react'

import { ENTITY_TYPE_LABELS } from './Details.utils'
import { EntityTypeIcon } from '@/components/ui/EntityTypeIcon'
import type { QueryRelation } from '@/data/sql/query-relations-query'

export const RelationDetailsHeader = ({
  relation,
  title = relation.name,
  subtitle = `${ENTITY_TYPE_LABELS[relation.type]} in ${relation.schema}`,
  description,
  action,
}: {
  relation: QueryRelation
  title?: string
  subtitle?: string
  description?: string | null
  /** The object's main action, such as adding a row, beside its name. */
  action?: ReactNode
}) => (
  <header className="flex flex-col gap-y-2 p-4">
    <div className="flex min-w-0 items-start gap-x-2">
      <span className="mt-0.5 shrink-0 text-foreground-lighter">
        <EntityTypeIcon type={relation.type} size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm text-foreground">{title}</h3>
        <p className="truncate text-sm text-foreground-lighter">{subtitle}</p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
    {description && <p className="text-sm text-foreground-light">{description}</p>}
  </header>
)
