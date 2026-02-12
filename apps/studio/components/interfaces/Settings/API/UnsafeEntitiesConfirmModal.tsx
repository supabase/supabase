import { ChevronRight, ChevronUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  Button,
  Collapsible_Shadcn_ as Collapsible,
  CollapsibleContent_Shadcn_ as CollapsibleContent,
  CollapsibleTrigger_Shadcn_ as CollapsibleTrigger,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import { type ExposedEntity } from './DataApiEnableSwitch.utils'

interface UnsafeEntitiesConfirmModalProps {
  visible: boolean
  loading: boolean
  unsafeEntities: Array<ExposedEntity>
  onCancel: () => void
  onConfirm: () => void
}

const ENTITY_TYPE_META: Record<
  ExposedEntity['type'],
  { heading: string; recommendation: string; docsUrl: string }
> = {
  table: {
    heading: 'Tables without Row Level Security',
    recommendation: 'Enable RLS on these tables to control access per-row.',
    docsUrl:
      'https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public',
  },
  'foreign table': {
    heading: 'Foreign tables',
    recommendation:
      'Foreign tables do not support RLS. Revoke access from the anon and authenticated roles.',
    docsUrl:
      'https://supabase.com/docs/guides/database/database-linter?lint=0017_foreign_table_in_api',
  },
  'materialized view': {
    heading: 'Materialized views',
    recommendation:
      'Materialized views do not support RLS. Revoke access from the anon and authenticated roles.',
    docsUrl:
      'https://supabase.com/docs/guides/database/database-linter?lint=0016_materialized_view_in_api',
  },
  view: {
    heading: 'Views without SECURITY INVOKER',
    recommendation:
      'These views run with the permissions of the view creator, not the querying user. Set SECURITY INVOKER to enforce caller permissions.',
    docsUrl:
      'https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view',
  },
}

const ENTITY_TYPE_ORDER: Array<ExposedEntity['type']> = [
  'table',
  'foreign table',
  'materialized view',
  'view',
]

const COLLAPSE_THRESHOLD = 3

export const UnsafeEntitiesConfirmModal = ({
  visible,
  loading,
  unsafeEntities,
  onCancel,
  onConfirm,
}: UnsafeEntitiesConfirmModalProps) => {
  const groupedEntities = useMemo(() => {
    const groups = new Map<ExposedEntity['type'], Array<ExposedEntity>>()
    for (const entity of unsafeEntities) {
      const group = groups.get(entity.type)
      if (group) {
        group.push(entity)
      } else {
        groups.set(entity.type, [entity])
      }
    }
    return ENTITY_TYPE_ORDER.filter((type) => groups.has(type)).map((type) => ({
      type,
      ...ENTITY_TYPE_META[type],
      entities: groups.get(type) ?? [],
    }))
  }, [unsafeEntities])

  return (
    <ConfirmationModal
      variant="warning"
      visible={visible}
      loading={loading}
      title="Insecure objects detected"
      confirmLabel="Enable Data API"
      confirmLabelLoading="Enabling"
      onCancel={onCancel}
      onConfirm={onConfirm}
      className="max-h-[50vh] overflow-y-auto"
    >
      <div className="text-sm text-foreground-light space-y-4">
        <p>
          The following objects will be publicly accessible through the Data API and are insecure.
        </p>
        {groupedEntities.map(({ type, heading, recommendation, docsUrl, entities }) => (
          <div key={type} className="space-y-1">
            <h4 className="text-foreground font-medium">{heading}</h4>
            <EntityList entities={entities} />
            <p className="text-foreground-lighter text-xs">
              {recommendation}{' '}
              <a
                href={docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                Learn more
              </a>
            </p>
          </div>
        ))}
      </div>
    </ConfirmationModal>
  )
}

const EntityListItem = ({ entity }: { entity: ExposedEntity }) => (
  <li>
    <code className="text-xs">
      {entity.schema}.{entity.name}
    </code>
  </li>
)

const EntityList = ({ entities }: { entities: Array<ExposedEntity> }) => {
  const [open, setOpen] = useState(false)

  const shouldCollapse = entities.length > COLLAPSE_THRESHOLD
  const visibleEntities = entities.slice(0, COLLAPSE_THRESHOLD)
  const hiddenEntities = entities.slice(COLLAPSE_THRESHOLD)

  if (!shouldCollapse) {
    return (
      <ul className="list-disc pl-5 space-y-0.5">
        {entities.map((entity) => (
          <EntityListItem key={`${entity.schema}.${entity.name}`} entity={entity} />
        ))}
      </ul>
    )
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <ul className="list-disc pl-5 space-y-0.5">
        {visibleEntities.map((entity) => (
          <EntityListItem key={`${entity.schema}.${entity.name}`} entity={entity} />
        ))}
      </ul>
      <CollapsibleContent className="transition-all data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
        <ul className="list-disc pl-5 space-y-0.5">
          {hiddenEntities.map((entity) => (
            <EntityListItem key={`${entity.schema}.${entity.name}`} entity={entity} />
          ))}
        </ul>
      </CollapsibleContent>
      <CollapsibleTrigger asChild>
        <Button
          type="text"
          size="tiny"
          className="px-0 h-auto text-xs text-foreground-lighter hover:text-foreground"
        >
          <div className="flex items-center gap-1">
            {open ? <ChevronUp size={12} /> : <ChevronRight size={12} />}
            <span>{open ? 'Show less' : `Show ${hiddenEntities.length} more`}</span>
          </div>
        </Button>
      </CollapsibleTrigger>
    </Collapsible>
  )
}
