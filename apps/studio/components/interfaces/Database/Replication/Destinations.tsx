import { useParams } from 'common'
import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useReplicationSinksQuery } from 'data/replication/sinks-query'
import { Plus } from 'lucide-react'
import { cn } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns'
import DestinationRow from './DestinationRow'
import { useReplicationPipelinesQuery } from 'data/replication/pipelines-query'

const Destinations = () => {
  const { ref: projectRef } = useParams()
  const {
    data: sinks_data,
    error: sinksError,
    isLoading: isSinksLoading,
    isError: isSinksError,
    isSuccess: isSinksSuccess,
  } = useReplicationSinksQuery({
    projectRef,
  })

  const {
    data: pipelines_data,
    error: pipelinesError,
    isLoading: isPipelinesLoading,
    isError: isPipelinesError,
    isSuccess: isPipelinesSuccess,
  } = useReplicationPipelinesQuery({
    projectRef,
  })

  const anyDestinations = isSinksSuccess && sinks_data.sinks.length > 0

  return (
    <>
      <div className="py-6">
        {isSinksLoading && <GenericSkeletonLoader />}

        {isSinksError && (
          <AlertError error={sinksError} subject="Failed to retrieve replication status" />
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
            body={sinks_data.sinks.map((sink) => {
              const pipeline = pipelines_data?.pipelines.find((p) => p.sink_id === sink.id)
              return (
                <DestinationRow
                  key={sink.id}
                  sink_name={sink.name}
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
          <div
            className={cn(
              'w-full',
              'border border-dashed bg-surface-100 border-overlay',
              'flex flex-col px-10 rounded-lg justify-center items-center'
            )}
          >
            <h4 className="pt-8">Send data to your first destination</h4>
            <p className="prose text-sm text-center mt-4">
              Use destinations to improve performance or run analysis on your data via integrations
              like BigQuery
            </p>
            <ButtonTooltip
              type="default"
              icon={<Plus />}
              tooltip={{
                content: {
                  side: 'bottom',
                  text: 'Add a new destination',
                },
              }}
              className="mt-6 mb-8"
            >
              Add destination
            </ButtonTooltip>
          </div>
        )}
      </div>
    </>
  )
}

export default Destinations
