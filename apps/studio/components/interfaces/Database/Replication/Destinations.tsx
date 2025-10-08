import { useQueryClient } from '@tanstack/react-query'
import { Plus, Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { useParams } from 'common'
import Table from 'components/to-be-cleaned/Table'
import { AlertError } from 'components/ui/AlertError'
import { DocsButton } from 'components/ui/DocsButton'
import { useReplicationDestinationsQuery } from 'data/replication/destinations-query'
import { replicationKeys } from 'data/replication/keys'
import { fetchReplicationPipelineVersion } from 'data/replication/pipeline-version-query'
import { useReplicationPipelinesQuery } from 'data/replication/pipelines-query'
import { useReplicationSourcesQuery } from 'data/replication/sources-query'
import { DOCS_URL } from 'lib/constants'
import { Button, cn, Input_Shadcn_ } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns'
import { DestinationPanel } from './DestinationPanel'
import { DestinationRow } from './DestinationRow'
import { EnableReplicationModal } from './EnableReplicationModal'
import { PIPELINE_ERROR_MESSAGES } from './Pipeline.utils'

export const Destinations = () => {
  const [showNewDestinationPanel, setShowNewDestinationPanel] = useState(false)
  const [filterString, setFilterString] = useState<string>('')
  const { ref: projectRef } = useParams()

  const {
    data: sourcesData,
    error: sourcesError,
    isLoading: isSourcesLoading,
    isError: isSourcesError,
    isSuccess: isSourcesSuccess,
  } = useReplicationSourcesQuery({
    projectRef,
  })

  const sourceId = sourcesData?.sources.find((s) => s.name === projectRef)?.id
  const replicationNotEnabled = isSourcesSuccess && !sourceId

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

  const hasDestinations = isDestinationsSuccess && destinationsData.destinations.length > 0

  const filteredDestinations =
    filterString.length === 0
      ? destinationsData?.destinations ?? []
      : (destinationsData?.destinations ?? []).filter((destination) =>
          destination.name.toLowerCase().includes(filterString.toLowerCase())
        )

  // Prefetch pipeline version info for all destinations on first load only
  const queryClient = useQueryClient()
  const prefetchedRef = useRef(false)
  useEffect(() => {
    if (
      projectRef &&
      !prefetchedRef.current &&
      pipelinesData?.pipelines &&
      pipelinesData.pipelines.length > 0 &&
      isPipelinesSuccess
    ) {
      prefetchedRef.current = true
      pipelinesData.pipelines.forEach((p) => {
        if (!p?.id) return
        queryClient.prefetchQuery({
          queryKey: replicationKeys.pipelinesVersion(projectRef, p.id),
          queryFn: ({ signal }) =>
            fetchReplicationPipelineVersion({ projectRef, pipelineId: p.id }, signal),
          staleTime: Infinity,
        })
      })
    }
  }, [projectRef, pipelinesData?.pipelines, isPipelinesSuccess, queryClient])

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
          {!!sourceId && (
            <Button type="default" icon={<Plus />} onClick={() => setShowNewDestinationPanel(true)}>
              Add destination
            </Button>
          )}
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

        {replicationNotEnabled ? (
          <div className="border rounded-md p-4 md:p-12 flex flex-col gap-y-4">
            <div className="flex flex-col gap-y-1">
              <h3>Run analysis on your data via integrations with Replication</h3>
              <p className="text-sm text-foreground-light">
                Enable replication on your project to send data to your first destination
              </p>
            </div>
            <div className="flex gap-x-2">
              <EnableReplicationModal />
              {/* [Joshen] Placeholder for when we have documentation */}
              <DocsButton href={`${DOCS_URL}`} />
            </div>
          </div>
        ) : hasDestinations ? (
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
                />
              )
            })}
          />
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
              <h4>Send data to your first destination</h4>
              <p className="prose text-sm text-center mt-1 max-w-full">
                Use destinations to improve performance or run analysis on your data via
                integrations like BigQuery
              </p>
              <Button
                icon={<Plus />}
                onClick={() => setShowNewDestinationPanel(true)}
                className="mt-4"
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
        hasDestinations && (
          <div className="text-center py-8 text-foreground-light">
            <p>No destinations match "{filterString}"</p>
          </div>
        )}

      <DestinationPanel
        visible={showNewDestinationPanel}
        sourceId={sourceId}
        onClose={() => setShowNewDestinationPanel(false)}
      />
    </>
  )
}
