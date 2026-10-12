import { useParams } from 'common'
import { useWatch, type UseFormReturn } from 'react-hook-form'
import { FormControl, FormField, Select, SelectContent, SelectItem, SelectTrigger } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { MultiSelector } from 'ui-patterns/multi-select'

import type { DestinationPanelSchemaType } from './DestinationForm.schema'
import {
  getTableSyncSelectionDescription,
  INITIAL_SYNC_FIELD_COPY,
  INITIAL_SYNC_LABELS,
} from './DestinationFormFieldCopy'
import {
  isMetadataListErrorVisible,
  isMetadataListLoading,
  isMetadataValueLoading,
  useRefreshOnOpen,
} from './useRefreshOnOpen'
import { useReplicationPublicationQuery } from '@/data/replication/publication-query'
import { useReplicationSourceId } from '@/data/replication/sources-query'
import { useReplicationTablesQuery } from '@/data/replication/tables-query'

interface TableCopySelectionProps {
  form: UseFormReturn<DestinationPanelSchemaType>
  editMode: boolean
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
    isPending,
    isFetching,
    isError: isErrorPublications,
    isSuccess: isSuccessPublication,
    refetch: refetchPublication,
  } = useReplicationPublicationQuery({ projectRef, sourceId, publicationName })
  const isLoadingPublicationTables =
    !!publicationName && isMetadataValueLoading(isPending || isFetching, selectedPublication)
  const { handleOpenChange: handleRefreshPublicationOnOpen } = useRefreshOnOpen({
    isEnabled: !!publicationName,
    refetch: refetchPublication,
  })

  const publicationTables = [...(selectedPublication?.tables ?? [])].sort((a, b) =>
    tableLabel(a).localeCompare(tableLabel(b))
  )
  const publicationTableIds = new Set(
    (selectedPublication?.tables ?? []).map(({ id }) => String(id))
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
    { enabled: staleSelectedCount > 0 }
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
            label={INITIAL_SYNC_FIELD_COPY.label}
            description={INITIAL_SYNC_FIELD_COPY.description}
          >
            <FormControl>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>{INITIAL_SYNC_LABELS[field.value]}</SelectTrigger>
                <SelectContent side="bottom" collisionPadding={16}>
                  <SelectItem value="include_all_tables" className="[&>span]:top-2.5">
                    <p>{INITIAL_SYNC_LABELS.include_all_tables}</p>
                    <p className="text-foreground-lighter">
                      Run initial sync for every publication table.
                    </p>
                  </SelectItem>
                  <SelectItem value="skip_tables" className="[&>span]:top-2.5">
                    <p>{INITIAL_SYNC_LABELS.skip_tables}</p>
                    <p className="text-foreground-lighter">
                      Skip initial sync for selected tables.
                    </p>
                  </SelectItem>
                  <SelectItem value="include_tables" className="[&>span]:top-2.5">
                    <p>{INITIAL_SYNC_LABELS.include_tables}</p>
                    <p className="text-foreground-lighter">
                      Run initial sync only for selected tables.
                    </p>
                  </SelectItem>
                  <SelectItem value="skip_all_tables" className="[&>span]:top-2.5">
                    <p>{INITIAL_SYNC_LABELS.skip_all_tables}</p>
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
              description={getTableSyncSelectionDescription({
                mode: tableSyncCopyMode === 'skip_tables' ? 'skip_tables' : 'include_tables',
                selectedCount: selectedPublicationCount,
                tableCount,
              })}
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
                  onOpenChange={handleRefreshPublicationOnOpen}
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
                      error={isMetadataListErrorVisible(
                        isErrorPublications,
                        publicationTables.length
                      )}
                      errorLabel="Unable to load tables"
                      loading={isMetadataListLoading(
                        isPending || isFetching,
                        publicationTables.length
                      )}
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
