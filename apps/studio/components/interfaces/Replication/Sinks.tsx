import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { Plus } from 'lucide-react'
import Table from 'components/to-be-cleaned/Table'
import { useParams } from 'common'
import { useReplicationPublicationsQuery } from 'data/replication/publications-query'
import { useReplicationSinksQuery } from 'data/replication/sinks-query'

export const ReplicationSinks = () => {
  const { ref } = useParams()
  const { data: sinks } = useReplicationSinksQuery({
    projectRef: ref,
  })

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
                    sinks?.length === 0 ? (
                      <Table.tr>
                        <Table.td align="center" colSpan={3}>
                          No sinks
                        </Table.td>
                      </Table.tr>
                    ) : (
                      <Table.tr>
                        <Table.td colSpan={3}>Some sinks</Table.td>
                      </Table.tr>
                    )
                  }
                ></Table>
              </div>
            </div>
          </div>
        </ScaffoldSection>
      </ScaffoldContainer>
    </>
  )
}
