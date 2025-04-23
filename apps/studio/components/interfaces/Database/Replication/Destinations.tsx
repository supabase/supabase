import { useParams } from 'common'
import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useReplicationSinksQuery } from 'data/replication/sinks-query'
import { Plus } from 'lucide-react'
import { Button, cn } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns'
import DestinationRow from './DestinationRow'
import { useReplicationPipelinesQuery } from 'data/replication/pipelines-query'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { useState } from 'react'
import NewDestinationPanel from './DestinationPanel'
import { useReplicationSourcesQuery } from 'data/replication/sources-query'
import { ScaffoldSection, ScaffoldSectionTitle } from 'components/layouts/Scaffold'

const Destinations = () => {
  const [showNewDestinationPanel, setShowNewDestinationPanel] = useState(false)
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

  let sourceId = sourcesData?.sources.find((s) => s.name === projectRef)?.id

  const {
    data: sinksData,
    error: sinksError,
    isLoading: isSinksLoading,
    isError: isSinksError,
    isSuccess: isSinksSuccess,
  } = useReplicationSinksQuery({
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

  const anySinks = isSinksSuccess && sinksData.sinks.length > 0

  return (
    <>
      <ScaffoldSection isFullWidth>
        <div className="flex justify-between items-center mb-4">
          <ScaffoldSectionTitle>Destinations</ScaffoldSectionTitle>
          <Button type="default" icon={<Plus />} onClick={() => setShowNewDestinationPanel(true)}>
            Add destination
          </Button>
        </div>
        {(isSourcesLoading || isSinksLoading) && <GenericSkeletonLoader />}

        {(isSourcesError || isSinksError) && (
          <AlertError
            error={sourcesError || sinksError}
            subject="Failed to retrieve destinations"
          />
        )}

        {anySinks ? (
          <Table
            head={[
              <Table.th key="name">Name</Table.th>,
              <Table.th key="type">Type</Table.th>,
              <Table.th key="status">Status</Table.th>,
              <Table.th key="publication">Publication</Table.th>,
              <Table.th key="actions"></Table.th>,
            ]}
            body={sinksData.sinks.map((sink) => {
              const pipeline = pipelinesData?.pipelines.find((p) => p.sink_id === sink.id)
              return (
                <DestinationRow
                  key={sink.id}
                  sourceId={sourceId}
                  sinkId={sink.id}
                  sinkName={sink.name}
                  type={sink.config.big_query ? 'BigQuery' : 'Other'}
                  pipeline={pipeline}
                  error={pipelinesError}
                  isLoading={isPipelinesLoading}
                  isError={isPipelinesError}
                  isSuccess={isPipelinesSuccess}
                ></DestinationRow>
              )
            })}
          ></Table>
        ) : (
          !isSourcesLoading &&
          !isSinksLoading &&
          !isSourcesError &&
          !isSinksError && (
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
      </ScaffoldSection>

      <NewDestinationPanel
        visible={showNewDestinationPanel}
        sourceId={sourceId}
        onClose={() => setShowNewDestinationPanel(false)}
      ></NewDestinationPanel>
    </>
  )
}

export default Destinations
