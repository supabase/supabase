import { useParams } from 'common'
import { useMemo } from 'react'
import { useWatch, type UseFormReturn } from 'react-hook-form'
import { FormControl, FormField, Select, SelectContent, SelectItem, SelectTrigger } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { MultiSelector } from 'ui-patterns/multi-select'

import type { DestinationPanelSchemaType } from './DestinationForm.schema'
import { useRefreshOnOpen } from './useRefreshOnOpen'
import { REPLICATION_METADATA_FRESHNESS_MS } from '@/data/replication/constants'
import { useReplicationPublicationQuery } from '@/data/replication/publication-query'
import { useReplicationSourceId } from '@/data/replication/sources-query'
import { useReplicationTablesQuery } from '@/data/replication/tables-query'

interface TableCopySelectionProps {
  form: UseFormReturn<DestinationPanelSchemaType>
  editMode: boolean
}

const INITIAL_SYNC_LABELS = {
  include_all_tables: 'All tables',
  skip_all_tables: 'No tables',
  include_tables: 'Selected tables only',
  skip_tables: 'All except selected tables',
}

const isSelectiveMode = (mode: DestinationPanelSchemaType['tableSyncCopyMode']) =>
  mode === 'include_tables' || mode === 'skip_tables'

const tableLabel = ({ schema, name }: { schema: string; name: string }) => `${schema}.${name}`

export const TableCopySelection = ({ form, editMode }: TableCopySelectionProps) => {
  const { ref: projectRef } = useParams()
  const sourceId = useReplicationSourceId({ projectRef })

  const [publicationName, tableSyncCopyMode, tableSyncCopyTableIds] = useWatch({
    control: form.control,
    name: ['publicationName', 'tableSyncCopyMode', 'tableSyncCopyTableIds'],
  })

  const {
    data: selectedPublication,
    isPending: isLoadingPublications,
    isFetching: isRefreshingPublications,
    isError: isErrorPublications,
    isSuccess: isSuccessPublication,
    refetch: refetchPublication,
  } = useReplicationPublicationQuery({ projectRef, sourceId, publicationName })
  const isLoadingPublicationTables =
    !!publicationName &&
    (isLoadingPublications || isRefreshingPublications) &&
    selectedPublication === undefined
  const refreshPublicationOnOpen = useRefreshOnOpen({
    enabled: !!publicationName,
    refetch: refetchPublication,
  })

  const publicationTables = useMemo(() => {
    return [...(selectedPublication?.tables ?? [])].sort((a, b) =>
      tableLabel(a).localeCompare(tableLabel(b))
    )
  }, [selectedPublication])

  const publicationTableIds = useMemo(
    () => new Set((selectedPublication?.tables ?? []).map(({ id }) => String(id))),
    [selectedPublication]
  )
  const tableLabelsById = new Map(
    publicationTables.map((table) => [String(table.id), tableLabel(table)])
  )
  const selectedPublicationCount = tableSyncCopyTableIds.filter((id) =>
    publicationTableIds.has(id)
  ).length
  const staleSelectedCount =
    !isSuccessPublication || isLoadingPublicationTables || isErrorPublications
      ? 0
      : tableSyncCopyTableIds.filter((id) => !publicationTableIds.has(id)).length
  const { data: sourceTables = [] } = useReplicationTablesQuery(
    { projectRef, sourceId },
    { enabled: staleSelectedCount > 0, staleTime: REPLICATION_METADATA_FRESHNESS_MS }
  )
  const sourceTableLabelsById = new Map(
    sourceTables.map((table) => [String(table.id), tableLabel(table)])
  )
  const tableCount = publicationTables.length

  return (
    <div className="flex flex-col gap-y-4">
      <FormField
        control={form.control}
        name="tableSyncCopyMode"
        render={({ field }) => (
          <FormItemLayout
            layout="horizontal"
            label="Initial sync"
            description="Choose which publication tables sync their existing rows. Ongoing replication includes new changes from every publication table, even when initial sync is skipped."
          >
            <FormControl>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>{INITIAL_SYNC_LABELS[field.value]}</SelectTrigger>
                <SelectContent>
                  <SelectItem value="include_all_tables" className="[&>span]:top-2.5">
                    <p>All tables</p>
                    <p className="text-foreground-lighter">
                      Run initial sync for every publication table.
                    </p>
                  </SelectItem>
                  <SelectItem value="skip_tables" className="[&>span]:top-2.5">
                    <p>All except selected tables</p>
                    <p className="text-foreground-lighter">
                      Skip initial sync for selected tables.
                    </p>
                  </SelectItem>
                  <SelectItem value="include_tables" className="[&>span]:top-2.5">
                    <p>Selected tables only</p>
                    <p className="text-foreground-lighter">
                      Run initial sync only for selected tables.
                    </p>
                  </SelectItem>
                  <SelectItem value="skip_all_tables" className="[&>span]:top-2.5">
                    <p>No tables</p>
                    <p className="text-foreground-lighter">
                      Skip initial sync and replicate new changes only.
                    </p>
                  </SelectItem>
                </SelectContent>
              </Select>
            </FormControl>
          </FormItemLayout>
        )}
      />

      {isErrorPublications && (
        <Admonition type="warning" title="Publication tables could not be loaded">
          <p className="leading-normal!">
            Refresh the page before changing or saving the initial sync settings.
          </p>
        </Admonition>
      )}

      {isSelectiveMode(tableSyncCopyMode) && (
        <FormField
          control={form.control}
          name="tableSyncCopyTableIds"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label={`${tableSyncCopyMode === 'skip_tables' ? 'Tables to exclude' : 'Tables to include'}${
                editMode ? '*' : ''
              }`}
              description={
                tableSyncCopyMode === 'skip_tables'
                  ? `${selectedPublicationCount} of ${tableCount} publication tables will skip initial sync. Ongoing replication will still include every publication table.`
                  : `${selectedPublicationCount} of ${tableCount} publication tables will run initial sync. Ongoing replication will still include every publication table.`
              }
            >
              <FormControl>
                <MultiSelector
                  values={field.value}
                  onValuesChange={(x) => {
                    field.onChange(x)
                  }}
                  disabled={
                    !publicationName ||
                    (!isLoadingPublicationTables && !isErrorPublications && tableCount === 0)
                  }
                  onOpenChange={refreshPublicationOnOpen}
                >
                  <MultiSelector.Trigger
                    aria-label="Select initial sync tables"
                    badgeLimit={3}
                    renderValue={(id) =>
                      tableLabelsById.get(id) ?? (
                        <span className="text-destructive-600">
                          {sourceTableLabelsById.get(id) ?? 'Previously selected table'}
                        </span>
                      )
                    }
                    label={publicationName ? 'Select tables...' : 'Select a publication first'}
                  />
                  <MultiSelector.Content>
                    <MultiSelector.List
                      emptyLabel="No tables available"
                      error={isErrorPublications && publicationTables.length === 0}
                      errorLabel="Unable to load tables"
                      loading={isLoadingPublicationTables}
                    >
                      {publicationTables.map((table) => (
                        <MultiSelector.Item key={table.id} value={String(table.id)}>
                          {tableLabel(table)}
                        </MultiSelector.Item>
                      ))}
                    </MultiSelector.List>
                  </MultiSelector.Content>
                </MultiSelector>
              </FormControl>

              {staleSelectedCount > 0 && (
                <p className="mt-2 text-sm text-destructive-600">
                  Some tables are no longer in the publication.
                </p>
              )}
            </FormItemLayout>
          )}
        />
      )}

      {editMode && isSelectiveMode(tableSyncCopyMode) && (
        <p className="text-sm text-foreground-lighter leading-normal">
          * Changes only affect tables whose initial sync has not completed. Use Reset table to sync
          existing rows again.
        </p>
      )}
    </div>
  )
}
