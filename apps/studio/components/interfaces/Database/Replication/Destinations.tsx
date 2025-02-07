import { useParams } from 'common'
import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useReplicationSinksQuery } from 'data/replication/sinks-query'
import { Edit, MoreVertical, Pause, Play, Plus, Trash } from 'lucide-react'
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns'

const Destinations = () => {
  const { ref: projectRef } = useParams()
  const { data, error, isLoading, isError, isSuccess } = useReplicationSinksQuery({
    projectRef,
  })

  console.log(`data: ${JSON.stringify(data)}`)
  const anyDestinations = isSuccess && data.sinks.length > 0

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

        {anyDestinations && (
          <Table
            head={[
              <Table.th key="name">Name</Table.th>,
              <Table.th key="type">Type</Table.th>,
              <Table.th key="status">Status</Table.th>,
              <Table.th key="publication">Publication</Table.th>,
              <Table.th key="actions"></Table.th>,
            ]}
            body={data.sinks.map((sink) => {
              const pipelineEnabled = true
              const status = pipelineEnabled ? 'Enabled' : 'Disabled'
              return (
                <Table.tr key={sink.id}>
                  <Table.td>{sink.name}</Table.td>
                  <Table.td>BigQuery</Table.td>
                  <Table.td>{status}</Table.td>
                  <Table.td>countries_pub</Table.td>
                  <Table.td>
                    {
                      <div className="flex justify-end items-center space-x-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button type="default" className="px-1" icon={<MoreVertical />} />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent side="bottom" align="end" className="w-32">
                            {!pipelineEnabled && (
                              <DropdownMenuItem className="space-x-2">
                                <Play size={14} />
                                <p>Enable</p>
                              </DropdownMenuItem>
                            )}
                            {pipelineEnabled && (
                              <DropdownMenuItem className="space-x-2">
                                <Pause size={14} />
                                <p>Disable</p>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="space-x-2">
                              <Edit size={14} />
                              <p>Edit destination</p>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="space-x-2">
                              <Trash stroke="red" size={14} />
                              <p>Delete destination</p>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    }
                  </Table.td>
                </Table.tr>
              )
            })}
          ></Table>
        )}
      </div>
    </>
  )
}

export default Destinations
