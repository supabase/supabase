import { useParams } from 'common'
import { ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  Checkbox,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from 'ui'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import {
  buildSelectionFromPublicationTables,
  buildWarehouseSetupTargets,
  getSchemaCheckedState,
  getSchemaTableKey,
  getSelectedTableCount,
  isSelectableWarehouseSchema,
  type SchemaTableSelection,
  type SchemaWithTables,
  type WarehouseSetupTarget,
} from './Warehouse.utils'
import { AlertError } from '@/components/ui/AlertError'
import { useSchemasQuery } from '@/data/database/schemas-query'
import { useReplicationPublicationQuery } from '@/data/replication/publication-query'
import { useReplicationSourcesQuery } from '@/data/replication/sources-query'
import { useTablesQuery } from '@/data/tables/tables-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { WAREHOUSE_PUBLICATION_NAME } from '@/lib/warehouse'
import type { ResponseError } from '@/types'

export interface WarehouseSchemaTablePickerProps {
  onSubmit: (targets: WarehouseSetupTarget[]) => void
  isSubmitting: boolean
  /** Set when editing an already-enabled Warehouse rather than setting one up for the first time. */
  isEditing?: boolean
  /** Failure from the submit itself, rendered inline rather than as a toast the user can lose. */
  error?: ResponseError | null
}

export const WarehouseSchemaTablePicker = ({
  onSubmit,
  isSubmitting,
  isEditing = false,
  error,
}: WarehouseSchemaTablePickerProps) => {
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()

  // `null` until the user touches a checkbox, so the selection seeded from the existing
  // publication can arrive asynchronously without an effect syncing it into state.
  const [selectionOverride, setSelectionOverride] = useState<SchemaTableSelection | null>(null)
  const [expandedOverrides, setExpandedOverrides] = useState<Record<string, boolean>>({})

  const {
    data: schemas,
    isPending: isSchemasPending,
    isError: isSchemasError,
    error: schemasError,
  } = useSchemasQuery({ projectRef, connectionString: project?.connectionString })

  const {
    data: tables,
    isPending: isTablesPending,
    isError: isTablesError,
    error: tablesError,
  } = useTablesQuery({ projectRef, connectionString: project?.connectionString })

  // The `supabase_warehouse` publication is the source of truth for what's currently replicated.
  // Reading the sources query directly (rather than via useReplicationSourceId) to get its
  // loading state: the publications query stays disabled until a source id exists, so without it
  // the list would render un-checked and then flash back to a loader once publications kick in.
  const { data: sourcesData, isLoading: isSourcesLoading } = useReplicationSourcesQuery({
    projectRef,
  })
  const sourceId = sourcesData?.sources.find((source) => source.name === projectRef)?.id

  const {
    data: publication,
    isError: isPublicationsError,
    error: publicationsError,
  } = useReplicationPublicationQuery({
    projectRef,
    sourceId,
    publicationName: WAREHOUSE_PUBLICATION_NAME,
  })

  // Derived from data presence rather than fetch status, so there's no render gap between the
  // publication query becoming enabled and it actually starting to fetch.
  const isSelectionPending =
    isSourcesLoading ||
    (sourceId !== undefined && publication === undefined && !isPublicationsError)

  const initialSelection = useMemo(
    () => buildSelectionFromPublicationTables(publication?.tables ?? []),
    [publication]
  )

  const selection = selectionOverride ?? initialSelection

  const schemasWithTables: SchemaWithTables[] = useMemo(() => {
    if (!schemas || !tables) return []
    return schemas
      .filter((schema) => isSelectableWarehouseSchema(schema.name))
      .map((schema) => ({
        schema: schema.name,
        tables: tables.filter((table) => table.schema === schema.name).map((table) => table.name),
      }))
      .sort((a, b) => a.schema.localeCompare(b.schema))
  }, [schemas, tables])

  const selectedCount = getSelectedTableCount(selection)

  const updateSelection = (updater: (current: SchemaTableSelection) => SchemaTableSelection) => {
    setSelectionOverride((prev) => updater(prev ?? initialSelection))
  }

  const toggleTable = (schema: string, table: string) => {
    const key = getSchemaTableKey(schema, table)
    updateSelection((current) => ({ ...current, [key]: !current[key] }))
  }

  const toggleSchema = (schema: SchemaWithTables) => {
    const allSelected =
      schema.tables.length > 0 &&
      schema.tables.every((table) => selection[getSchemaTableKey(schema.schema, table)])

    updateSelection((current) => {
      const next = { ...current }
      schema.tables.forEach((table) => {
        next[getSchemaTableKey(schema.schema, table)] = !allSelected
      })
      return next
    })
  }

  const setExpanded = (schemaName: string, isOpen: boolean) => {
    setExpandedOverrides((prev) => ({ ...prev, [schemaName]: isOpen }))
  }

  const handleSubmit = () => {
    const targets = buildWarehouseSetupTargets(selection, schemasWithTables)
    if (targets.length === 0) return
    onSubmit(targets)
  }

  // Waiting on the publication too, so the pre-checked selection is in place before the user can
  // start toggling (an early toggle would otherwise pin an override that omits existing tables).
  if (isSchemasPending || isTablesPending || isSelectionPending) return <GenericSkeletonLoader />
  if (isSchemasError) return <AlertError subject="Failed to load schemas" error={schemasError} />
  if (isTablesError) return <AlertError subject="Failed to load tables" error={tablesError} />
  // Only blocking when editing: a first-time setup starts from an empty selection anyway, so a
  // failed publication lookup shouldn't stop the user from enabling Warehouse at all.
  if (isEditing && isPublicationsError) {
    return <AlertError subject="Failed to load replicated tables" error={publicationsError} />
  }

  return (
    <PageSection className="first:pt-0">
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Tables</PageSectionTitle>
          <PageSectionDescription>
            {isEditing
              ? 'Tables currently replicating are selected. Changes apply on save.'
              : 'Choose which schemas or tables to replicate. You can change this later at any time.'}
          </PageSectionDescription>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent className="space-y-4">
        {!!error && (
          <AlertError
            subject={
              isEditing ? 'Failed to update replicated tables' : 'Failed to enable Warehouse'
            }
            error={error}
          />
        )}
        <Card>
          <CardContent className="p-0 divide-y">
            {schemasWithTables.map((schema) => {
              const keys = schema.tables.map((table) => getSchemaTableKey(schema.schema, table))
              const checkedCount = keys.filter((key) => selection[key]).length
              const checkedState = getSchemaCheckedState({
                selectedCount: checkedCount,
                totalCount: keys.length,
              })
              const isOpen = expandedOverrides[schema.schema] ?? checkedCount > 0

              return (
                <Collapsible
                  key={schema.schema}
                  open={isOpen}
                  onOpenChange={(open) => setExpanded(schema.schema, open)}
                >
                  <div className="flex items-center gap-2 px-3 py-2 bg-surface-75">
                    <CollapsibleTrigger
                      aria-label={isOpen ? `Collapse ${schema.schema}` : `Expand ${schema.schema}`}
                      className="group text-foreground-lighter"
                    >
                      <ChevronRight
                        size={14}
                        className="transition-transform group-data-[state=open]:rotate-90"
                      />
                    </CollapsibleTrigger>
                    <Checkbox
                      checked={checkedState}
                      onCheckedChange={() => toggleSchema(schema)}
                      disabled={schema.tables.length === 0}
                      aria-label={`Select all tables in ${schema.schema}`}
                      // The shared Checkbox only fills itself for `data-state=checked`, so a partial
                      // selection would otherwise render identically to an empty one. A muted fill
                      // keeps all three states visually distinct.
                      className="data-[state=indeterminate]:border-foreground-lighter data-[state=indeterminate]:bg-foreground-lighter"
                    />
                    <span className="text-sm font-mono text-foreground">{schema.schema}</span>
                    <span className="text-xs text-foreground-lighter ml-auto">
                      {checkedCount}/{keys.length} tables
                    </span>
                  </div>
                  <CollapsibleContent>
                    {schema.tables.map((table) => {
                      const key = getSchemaTableKey(schema.schema, table)
                      return (
                        <div key={key} className="flex items-center gap-2 pl-10 pr-3 py-2">
                          <Checkbox
                            checked={!!selection[key]}
                            onCheckedChange={() => toggleTable(schema.schema, table)}
                            aria-label={`Select ${schema.schema}.${table}`}
                          />
                          <span className="text-sm font-mono text-foreground-light">{table}</span>
                        </div>
                      )
                    })}
                    {schema.tables.length === 0 && (
                      <p className="pl-10 pr-3 py-2 text-sm text-foreground-lighter">
                        No tables in this schema.
                      </p>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              )
            })}
          </CardContent>
          <CardFooter className="justify-between">
            <span className="text-sm text-foreground-lighter">
              {selectedCount} table{selectedCount === 1 ? '' : 's'} selected
            </span>
            {/*
              An empty selection is a valid request that tears Warehouse down, so submitting one
              from here would destroy a project's Warehouse with no confirmation. Disabling keeps
              teardown on the dedicated action, which asks first.
            */}
            <Button
              variant="primary"
              disabled={selectedCount === 0}
              loading={isSubmitting}
              onClick={handleSubmit}
            >
              {isEditing ? 'Update replicated tables' : 'Enable Warehouse'}
            </Button>
          </CardFooter>
        </Card>
      </PageSectionContent>
    </PageSection>
  )
}
