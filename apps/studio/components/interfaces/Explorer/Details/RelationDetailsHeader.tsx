import { ENTITY_TYPE_LABELS } from './Details.utils'
import { EntityTypeIcon } from '@/components/ui/EntityTypeIcon'
import type { QueryRelation } from '@/data/sql/query-relations-query'

export const RelationDetailsHeader = ({
  relation,
  description,
}: {
  relation: QueryRelation
  description?: string | null
}) => (
  <header className="flex flex-col gap-y-2 p-4">
    <div className="flex min-w-0 items-start gap-x-2">
      <span className="mt-0.5 shrink-0 text-foreground-lighter">
        <EntityTypeIcon type={relation.type} size={16} />
      </span>
      <div className="min-w-0">
        <h3 className="truncate text-sm text-foreground">{relation.name}</h3>
        <p className="truncate text-sm text-foreground-lighter">
          {ENTITY_TYPE_LABELS[relation.type]} in {relation.schema}
        </p>
      </div>
    </div>
    {description && <p className="text-sm text-foreground-light">{description}</p>}
  </header>
)
