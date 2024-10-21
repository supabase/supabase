import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { Plus } from 'lucide-react'
import Table from 'components/to-be-cleaned/Table'
import { useParams } from 'common'
import { useReplicationSinksQuery } from 'data/replication/sinks-query'
import { useState } from 'react'
import CreateSinkModal from './CreateSinkModal'
import { Button } from 'ui'
import { toast } from 'sonner'
import { DeleteSinkModal } from './DeleteSinkModal'

export const ReplicationSinks = () => {
  const { ref } = useParams()
  const { data: sinks_data } = useReplicationSinksQuery({
    projectRef: ref,
  })
  const [showCreateSinkModal, setShowCreateSinkModal] = useState(false)
  const [showDeleteSinkModal, setShowDeleteSinkModal] = useState(false)
  const [sinkIdToDelete, setSinkIdToDelete] = useState(-1)

  const sinks = sinks_data ?? []

  return (
    <>
      <ScaffoldContainer>
        <ScaffoldSection>
          <div className="col-span-12">
            <FormHeader title="Sinks"></FormHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <ButtonTooltip
                  className="ml-auto"
                  icon={<Plus />}
                  tooltip={{
                    content: {
                      side: 'bottom',
                      text: 'Create a sink',
                    },
                  }}
                  onClick={() => setShowCreateSinkModal(true)}
                >
                  New Sink
                </ButtonTooltip>
              </div>
              <div className="my-4 w-full">
                <Table
                  head={[
                    <Table.th key="id">Id</Table.th>,
                    <Table.th key="edit">Edit</Table.th>,
                    <Table.th key="delete">Delete</Table.th>,
                  ]}
                  body={
                    sinks.length === 0 ? (
                      <Table.tr>
                        <Table.td align="center" colSpan={3}>
                          No sinks
                        </Table.td>
                      </Table.tr>
                    ) : (
                      sinks.map((sink) => (
                        <Table.tr key={sink.id}>
                          <Table.td>{sink.id}</Table.td>
                          <Table.td>
                            <Button
                              type="default"
                              onClick={() => {
                                toast.info('Editing a sink is not yet implemented')
                              }}
                            >
                              Edit
                            </Button>
                          </Table.td>
                          <Table.td>
                            <Button
                              type="danger"
                              onClick={() => {
                                setSinkIdToDelete(sink.id)
                                setShowDeleteSinkModal(true)
                              }}
                            >
                              Delete
                            </Button>
                          </Table.td>
                        </Table.tr>
                      ))
                    )
                  }
                ></Table>
              </div>
            </div>
          </div>
        </ScaffoldSection>
      </ScaffoldContainer>
      <CreateSinkModal
        visible={showCreateSinkModal}
        onClose={() => setShowCreateSinkModal(false)}
      />
      <DeleteSinkModal
        visible={showDeleteSinkModal}
        title={`Delete sink with id ${sinkIdToDelete}?`}
        sinkId={sinkIdToDelete}
        onClose={() => setShowDeleteSinkModal(false)}
      />
    </>
  )
}
