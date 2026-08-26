import { useParams } from 'common'
import { useMemo } from 'react'
import { useWatch, type UseFormReturn } from 'react-hook-form'
import { FormControl, FormField, Select, SelectContent, SelectItem, SelectTrigger } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { MultiSelector } from 'ui-patterns/multi-select'

import type { DestinationPanelSchemaType } from './DestinationForm.schema'
import { getPublicationTableIds } from './DestinationForm.utils'
import { useReplicationPublicationsQuery } from '@/data/replication/publications-query'
import { useReplicationSourceId } from '@/data/replication/sources-query'

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
    data: publications = [],
    isPending: isLoadingPublications,
    isError: isErrorPublications,
  } = useReplicationPublicationsQuery({ projectRef, sourceId })

  // Only publication tables are ever selectable or displayed by name. A table
  // id is never resolved outside of the publication response — there's no
  // other source for a name to come from without a separate, source-wide
  // catalog fetch, which selective table-copy doesn't need.
  const publicationTables = useMemo(() => {
    const publication = publications.find(({ name }) => name === publicationName)
    return [...(publication?.tables ?? [])].sort((a, b) =>
      tableLabel(a).localeCompare(tableLabel(b))
    )
  }, [publicationName, publications])

  const publicationTableIds = useMemo(
    () => getPublicationTableIds(publications, publicationName),
    [publications, publicationName]
  )
  const tableLabelsById = new Map(
    publicationTables.map((table) => [String(table.id), tableLabel(table)])
  )
  const selectedPublicationCount = tableSyncCopyTableIds.filter((id) =>
    publicationTableIds.has(id)
  ).length
  const staleSelectedCount =
    isLoadingPublications || isErrorPublications
      ? 0
      : tableSyncCopyTableIds.filter((id) => !publicationTableIds.has(id)).length
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

      {editMode && (
        <Admonition type="note" title="Changes apply only before initial sync completes">
          <p className="leading-normal!">
            Tables that have completed initial sync will not sync existing rows again unless you
            restart them.
          </p>
        </Admonition>
      )}

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
              label={
                tableSyncCopyMode === 'skip_tables' ? 'Tables to exclude' : 'Tables to include'
              }
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
                    isLoadingPublications ||
                    isErrorPublications ||
                    !publicationName ||
                    tableCount === 0
                  }
                >
                  <MultiSelector.Trigger
                    badgeLimit={3}
                    renderValue={(id) => tableLabelsById.get(id) ?? 'Unavailable table'}
                    label={
                      isLoadingPublications
                        ? 'Loading publication tables...'
                        : publicationName
                          ? 'Select tables...'
                          : 'Select a publication first'
                    }
                  />
                  <MultiSelector.Content>
                    <MultiSelector.List>
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
                <Admonition
                  type="warning"
                  className="mt-2"
                  title={`${
                    staleSelectedCount === 1
                      ? 'A previously selected table is'
                      : `${staleSelectedCount} previously selected tables are`
                  }{' '}
                    no longer in this publication.`}
                >
                  <p className="leading-normal!">
                    {staleSelectedCount === 1 ? 'It' : 'They'} will be excluded from this pipeline's
                    initial sync settings when you save.
                  </p>
                </Admonition>
              )}
            </FormItemLayout>
          )}
        />
      )}
    </div>
  )
}
