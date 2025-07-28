import { noop } from 'lodash'
import { Plus, Search } from 'lucide-react'
import { useState } from 'react'

import { useParams } from 'common'
import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import { useReplicationDestinationsQuery } from 'data/replication/destinations-query'
import { useReplicationPipelinesQuery } from 'data/replication/pipelines-query'
import { useReplicationSourcesQuery } from 'data/replication/sources-query'
import { Button, cn, Input_Shadcn_ } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns'
import NewDestinationPanel from './DestinationPanel'
import { DestinationRow } from './DestinationRow'
import { PIPELINE_ERROR_MESSAGES } from './Pipeline.utils'

interface DestinationsProps {
  onSelectPipeline?: (pipelineId: number, destinationName: string) => void
}

export const Destinations = ({ onSelectPipeline = noop }: DestinationsProps) => {
  const [showNewDestinationPanel, setShowNewDestinationPanel] = useState(false)
  const [filterString, setFilterString] = useState<string>('')
  const { ref: projectRef } = useParams()

  const {
    data: sourcesData,
    error: sourcesError,
    isLoading: isSourcesLoading,
    isError: isSourcesError,
  } = useReplicationSourcesQuery({
    projectRef,
  })

  const sourceId = sourcesData?.sources.find((s) => s.name === projectRef)?.id

  const {
    data: destinationsData,
    error: destinationsError,
    isLoading: isDestinationsLoading,
    isError: isDestinationsError,
    isSuccess: isDestinationsSuccess,
  } = useReplicationDestinationsQuery({
    projectRef,
  })

  const {
    data: pipelinesData,
    error: pipelinesError,
    isLoading: isPipelinesLoading,
    isError: isPipelinesError,
    isSuccess: isPipelinesSuccess,
  } = useReplicationPipelinesQuery({
    projectRef,
  })

  const anyDestinations = isDestinationsSuccess && destinationsData.destinations.length > 0

  const filteredDestinations =
    filterString.length === 0
      ? destinationsData?.destinations ?? []
      : (destinationsData?.destinations ?? []).filter((destination) =>
          destination.name.toLowerCase().includes(filterString.toLowerCase())
        )

  return (
    <>
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-lighter"
                size={14}
              />
              <Input_Shadcn_
                className="pl-9 h-7"
                placeholder={'Filter destinations'}
                value={filterString}
                onChange={(e) => setFilterString(e.target.value)}
              />
            </div>
          </div>
          <Button type="default" icon={<Plus />} onClick={() => setShowNewDestinationPanel(true)}>
            Add destination
          </Button>
        </div>
      </div>

      <div className="w-full overflow-hidden overflow-x-auto">
        {(isSourcesLoading || isDestinationsLoading) && <GenericSkeletonLoader />}

        {(isSourcesError || isDestinationsError) && (
          <AlertError
            error={sourcesError || destinationsError}
            subject={PIPELINE_ERROR_MESSAGES.RETRIEVE_DESTINATIONS}
          />
        )}

        {anyDestinations ? (
          <Table
            head={[
              <Table.th key="name">Name</Table.th>,
              <Table.th key="type">Type</Table.th>,
              <Table.th key="status">Status</Table.th>,
              <Table.th key="publication">Publication</Table.th>,
              <Table.th key="actions"></Table.th>,
            ]}
            body={filteredDestinations.map((destination) => {
              const pipeline = pipelinesData?.pipelines.find(
                (p) => p.destination_id === destination.id
              )
              return (
                <DestinationRow
                  key={destination.id}
                  sourceId={sourceId}
                  destinationId={destination.id}
                  destinationName={destination.name}
                  type={destination.config.big_query ? 'BigQuery' : 'Other'}
                  pipeline={pipeline}
                  error={pipelinesError}
                  isLoading={isPipelinesLoading}
                  isError={isPipelinesError}
                  isSuccess={isPipelinesSuccess}
                  onSelectPipeline={onSelectPipeline}
                />
              )
            })}
          ></Table>
        ) : (
          !isSourcesLoading &&
          !isDestinationsLoading &&
          !isSourcesError &&
          !isDestinationsError && (
            <div
              className={cn(
                'w-full',
                'border border-dashed bg-surface-100 border-overlay',
                'flex flex-col px-10 rounded-lg justify-center items-center py-8 mt-4'
              )}
            >
              <h4 className="text-lg">Send data to your first destination</h4>
              <p className="prose text-sm text-center mt-2">
                Use destinations to improve performance or run analysis on your data via
                integrations like BigQuery
              </p>
              <Button
                icon={<Plus />}
                onClick={() => setShowNewDestinationPanel(true)}
                className="mt-6"
              >
                Add destination
              </Button>
            </div>
          )
        )}
      </div>

      {!isSourcesLoading &&
        !isDestinationsLoading &&
        filteredDestinations.length === 0 &&
        anyDestinations && (
          <div className="text-center py-8 text-foreground-light">
            <p>No destinations match "{filterString}"</p>
          </div>
        )}

      <NewDestinationPanel
        visible={showNewDestinationPanel}
        sourceId={sourceId}
        onClose={() => setShowNewDestinationPanel(false)}
      />
    </>
  )
}
