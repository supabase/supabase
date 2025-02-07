import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useReplicationSinksQuery } from 'data/replication/sinks-query'
import { Plus } from 'lucide-react'
import { cn } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns'

const Destinations = () => {
  const { ref: projectRef } = useParams()
  const {
    data: sinks,
    error,
    isLoading,
    isError,
    isSuccess,
  } = useReplicationSinksQuery({
    projectRef,
  })

  const anyDestinations = isSuccess && sinks.sinks.length > 0

  return (
    <>
      <div className="py-6">
        {isLoading && <GenericSkeletonLoader />}

        {isError && <AlertError error={error} subject="Failed to retrieve replication status" />}

        {!anyDestinations && (
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
