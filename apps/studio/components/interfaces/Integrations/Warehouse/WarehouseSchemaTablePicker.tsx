import { useParams } from 'common'
import { useMemo, useState } from 'react'
import { Button, Card, CardContent, CardFooter, CommandGroup } from 'ui'
import { FormLayout } from 'ui-patterns/form/Layout/FormLayout'
import { MultiSelector } from 'ui-patterns/multi-select'
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
  buildSchemasWithTables,
  buildSelectionFromPublicationTables,
  buildWarehouseSetupTargets,
  getSchemaTableKey,
  getSelectedTableCount,
  hasSelectionChanged,
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
  const {
    data: sourcesData,
    isLoading: isSourcesLoading,
    isError: isSourcesError,
    error: sourcesError,
  } = useReplicationSourcesQuery({ projectRef }, { enabled: isEditing })
  const sourceId = sourcesData?.sources.find((source) => source.name === projectRef)?.id

  const {
    data: publication,
    isError: isPublicationsError,
    error: publicationsError,
  } = useReplicationPublicationQuery(
    {
      projectRef,
      sourceId,
      publicationName: WAREHOUSE_PUBLICATION_NAME,
    },
    { enabled: isEditing }
  )

  // Derived from data presence rather than fetch status, so there's no render gap between the
  // publication query becoming enabled and it actually starting to fetch.
  const isSelectionPending =
    isEditing &&
    (isSourcesLoading ||
      (sourceId !== undefined && publication === undefined && !isPublicationsError))

  const initialSelection = useMemo(
    () => (isEditing ? buildSelectionFromPublicationTables(publication?.tables ?? []) : {}),
    [isEditing, publication]
  )

  const schemasWithTables: SchemaWithTables[] = useMemo(() => {
    if (!schemas || !tables) return []
    return buildSchemasWithTables(schemas, tables)
  }, [schemas, tables])

  const tableKeys = schemasWithTables.flatMap(({ schema, tables }) =>
    tables.map((table) => getSchemaTableKey(schema, table))
  )
  const selection = selectionOverride ?? initialSelection
  const selectedCount = getSelectedTableCount(selection)
  const selectedTableKeys = tableKeys.filter((key) => selection[key])
  const hasChanges = hasSelectionChanged(selection, initialSelection)

  const updateSelection = (updater: (current: SchemaTableSelection) => SchemaTableSelection) => {
    setSelectionOverride((prev) => updater(prev ?? initialSelection))
  }

  const handleSchemaSelection = (schema: SchemaWithTables) => {
    const keys = schema.tables.map((table) => getSchemaTableKey(schema.schema, table))
    const areAllSelected = keys.every((key) => selection[key])

    updateSelection((current) => ({
      ...current,
      ...Object.fromEntries(keys.map((key) => [key, !areAllSelected])),
    }))
  }

  const handleSubmit = () => {
    const targets = buildWarehouseSetupTargets(selection, schemasWithTables)
    if (targets.length === 0) return
    onSubmit(targets)
  }

  // When editing, wait for the publication so its selection is in place before the user can
  // start toggling. First-time setup always starts empty and does not need to wait for it.
  if (isSchemasPending || isTablesPending || isSelectionPending) {
    return (
      <PageSection className="pt-5!">
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>Tables</PageSectionTitle>
            <PageSectionDescription>
              {isEditing
                ? 'Tables currently replicating are selected. Changes apply on save.'
                : 'Choose which schemas or tables to replicate. You can change this at any time.'}
            </PageSectionDescription>
          </PageSectionSummary>
        </PageSectionMeta>
        <PageSectionContent>
          <Card>
            <CardContent>
              <GenericSkeletonLoader />
            </CardContent>
          </Card>
        </PageSectionContent>
      </PageSection>
    )
  }
  if (isSchemasError) {
    return (
      <AlertError projectRef={projectRef} subject="Failed to load schemas" error={schemasError} />
    )
  }
  if (isTablesError) {
    return (
      <AlertError projectRef={projectRef} subject="Failed to load tables" error={tablesError} />
    )
  }
  if (isEditing && isSourcesError) {
    return (
      <AlertError
        projectRef={projectRef}
        subject="Failed to load replicated tables"
        error={sourcesError}
      />
    )
  }
  // Only blocking when editing: a first-time setup starts from an empty selection anyway, so a
  // failed publication lookup shouldn't stop the user from enabling Warehouse at all.
  if (isEditing && isPublicationsError) {
    return (
      <AlertError
        projectRef={projectRef}
        subject="Failed to load replicated tables"
        error={publicationsError}
      />
    )
  }

  return (
    <PageSection className="pt-5!">
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Tables</PageSectionTitle>
          <PageSectionDescription>
            {isEditing
              ? 'Tables currently replicating are selected. Changes apply on save.'
              : 'Choose which schemas or tables to replicate. You can change this at any time.'}
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
            projectRef={projectRef}
          />
        )}
        <Card>
          <CardContent>
            <FormLayout
              layout="horizontal"
              label="Tables to replicate"
              description={
                <span aria-live="polite">
                  {selectedCount} table{selectedCount === 1 ? '' : 's'} selected
                </span>
              }
            >
              <MultiSelector
                values={selectedTableKeys}
                filter={(value, search, keywords) => {
                  const normalizedSearch = search.toLowerCase()
                  return [value, ...(keywords ?? [])].some((candidate) =>
                    candidate.toLowerCase().includes(normalizedSearch)
                  )
                    ? 1
                    : 0
                }}
                onValuesChange={(values) => {
                  const nextValues = new Set(values)
                  updateSelection(() =>
                    Object.fromEntries(tableKeys.map((key) => [key, nextValues.has(key)]))
                  )
                }}
                className="w-full"
              >
                <MultiSelector.Trigger
                  aria-label="Select tables to replicate"
                  label="Select tables..."
                  // Show plenty of selected tables; wrapBadges keeps the +n count visible when wrapping.
                  badgeLimit={10}
                  wrapBadges
                  renderValue={(value) => <span className="max-w-32 truncate">{value}</span>}
                  className="w-full"
                />
                <MultiSelector.Content>
                  <MultiSelector.Input placeholder="Search schemas and tables..." showResetIcon />
                  <MultiSelector.List emptyLabel="No tables available">
                    {schemasWithTables
                      .filter((schema) => schema.tables.length > 0)
                      .map((schema) => {
                        const keys = schema.tables.map((table) =>
                          getSchemaTableKey(schema.schema, table)
                        )
                        const areAllSelected = keys.every((key) => selection[key])

                        return (
                          <CommandGroup
                            key={schema.schema}
                            heading={
                              <div className="flex items-center justify-between">
                                <span>{schema.schema}</span>
                                <Button
                                  type="button"
                                  variant="text"
                                  size="tiny"
                                  className="font-sans! normal-case! tracking-normal!"
                                  onClick={() => handleSchemaSelection(schema)}
                                >
                                  {areAllSelected ? 'Clear' : 'Select all'}
                                </Button>
                              </div>
                            }
                          >
                            {schema.tables.map((table) => {
                              const key = getSchemaTableKey(schema.schema, table)
                              return (
                                <MultiSelector.Item
                                  key={key}
                                  value={key}
                                  keywords={[schema.schema, key]}
                                >
                                  {table}
                                </MultiSelector.Item>
                              )
                            })}
                          </CommandGroup>
                        )
                      })}
                  </MultiSelector.List>
                </MultiSelector.Content>
              </MultiSelector>
            </FormLayout>
          </CardContent>
          <CardFooter className="justify-end gap-2">
            {/*
              An empty selection is a valid request that tears Warehouse down, so submitting one
              from here would destroy a project's Warehouse with no confirmation. Disabling keeps
              teardown on the dedicated action, which asks first.
            */}
            {isEditing && hasChanges && (
              <Button
                variant="default"
                disabled={isSubmitting}
                onClick={() => setSelectionOverride(null)}
              >
                Cancel
              </Button>
            )}
            <Button
              variant="primary"
              disabled={selectedCount === 0 || !hasChanges}
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
