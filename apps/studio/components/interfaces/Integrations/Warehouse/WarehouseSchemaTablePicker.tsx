import { useParams } from 'common'
import { useMemo, useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CommandGroup,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'ui'
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
  buildSelectionFromPublicationTables,
  buildWarehouseSetupTargets,
  getSchemaTableKey,
  getSelectedTableCount,
  isPipelineLimitError,
  isSelectableWarehouseSchema,
  type SchemaTableSelection,
  type SchemaWithTables,
  type WarehouseSetupTarget,
} from './Warehouse.utils'
import { AlertError } from '@/components/ui/AlertError'
import { InlineLink } from '@/components/ui/InlineLink'
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
  const [selectionModeOverride, setSelectionModeOverride] = useState<'all' | 'selected' | null>(
    null
  )

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

  const tableKeys = schemasWithTables.flatMap(({ schema, tables }) =>
    tables.map((table) => getSchemaTableKey(schema, table))
  )
  const allTablesSelection = Object.fromEntries(tableKeys.map((key) => [key, true]))
  const initialSelectedCount = getSelectedTableCount(initialSelection)
  const areAllTablesInitiallySelected =
    initialSelectedCount === tableKeys.length && tableKeys.length > 0
  const initialSelectionMode = !isEditing || areAllTablesInitiallySelected ? 'all' : 'selected'
  const selectionMode = selectionModeOverride ?? initialSelectionMode
  const selection =
    selectionMode === 'all' ? allTablesSelection : (selectionOverride ?? initialSelection)
  const selectedCount = getSelectedTableCount(selection)
  const selectedTableKeys = tableKeys.filter((key) => selection[key])

  const updateSelection = (updater: (current: SchemaTableSelection) => SchemaTableSelection) => {
    setSelectionOverride((prev) => updater(prev ?? initialSelection))
  }

  const handleSelectionModeChange = (value: string) => {
    if (value !== 'all' && value !== 'selected') return
    if (value === 'selected' && selectionOverride === null) {
      setSelectionOverride({})
    }
    setSelectionModeOverride(value)
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

  // Waiting on the publication too, so the pre-checked selection is in place before the user can
  // start toggling (an early toggle would otherwise pin an override that omits existing tables).
  if (isSchemasPending || isTablesPending || isSelectionPending) {
    return (
      <PageSection className="first:pt-0">
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
              : 'Choose which schemas or tables to replicate. You can change this at any time.'}
          </PageSectionDescription>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent className="space-y-4">
        {!!error && (
          <AlertError
            subject={
              isPipelineLimitError(error.message)
                ? 'This project has no replication pipeline available'
                : isEditing
                  ? 'Failed to update replicated tables'
                  : 'Failed to enable Warehouse'
            }
            error={error}
          >
            {isPipelineLimitError(error.message) && (
              <p className="text-sm">
                Warehouse needs a replication pipeline of its own. Remove an existing pipeline in{' '}
                <InlineLink href={`/project/${projectRef}/database/replication`}>
                  Database Replication
                </InlineLink>{' '}
                and try again.
              </p>
            )}
          </AlertError>
        )}
        <Card>
          <CardContent>
            <FormLayout
              layout="horizontal"
              label="Tables to replicate"
              description="Choose whether to replicate every eligible table or only selected tables."
            >
              <Select value={selectionMode} onValueChange={handleSelectionModeChange}>
                <SelectTrigger aria-label="Tables to replicate">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All tables</SelectItem>
                  <SelectItem value="selected">Selected tables</SelectItem>
                </SelectContent>
              </Select>
            </FormLayout>
          </CardContent>
          {selectionMode === 'selected' && (
            <>
              <CardContent>
                <FormLayout
                  layout="horizontal"
                  label="Selected tables"
                  description={`${selectedCount} table${selectedCount === 1 ? '' : 's'} selected`}
                >
                  <MultiSelector
                    values={selectedTableKeys}
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
                      badgeLimit={3}
                      className="w-full"
                    />
                    <MultiSelector.Content>
                      <MultiSelector.Input placeholder="Search tables..." showResetIcon />
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
                                    <MultiSelector.Item key={key} value={key}>
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
            </>
          )}
          <CardFooter className="justify-end">
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
