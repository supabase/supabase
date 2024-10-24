import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { Plus } from 'lucide-react'
import Table from 'components/to-be-cleaned/Table'
import { useReplicationSourcesQuery } from 'data/replication/sources-query'
import { useParams } from 'common'
import { useReplicationPublicationsQuery } from 'data/replication/publications-query'
import { Button } from 'ui'
import { useState } from 'react'
import CreatePublicationModal from './CreatePublicationModal'
import { toast } from 'sonner'
import { DeletePublicationModal } from './DeletePublicationModal'

export const ReplicationPublications = () => {
  const { ref } = useParams()
  const { data: sources_data } = useReplicationSourcesQuery({
    projectRef: ref,
  })
  const [showCreatePublicationModal, setShowCreatePublicationModal] = useState(false)
  const [showDeletePublicationModal, setShowDeletePublicationModal] = useState(false)
  const [publicationToDelete, setPublicationToDelete] = useState('')

  const sources = sources_data ?? []
  const thisProjectSource = sources.find((s) => s.name === ref)

  if (!thisProjectSource) {
    toast.error("Failed to find this project's source")
  }

  const { data: pub_data } = useReplicationPublicationsQuery({
    projectRef: ref,
    sourceId: thisProjectSource!.id,
  })

  const publications = pub_data ?? []

  return (
    <>
      <ScaffoldContainer>
        <ScaffoldSection>
          <div className="col-span-12">
            <FormHeader title="Publications"></FormHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <ButtonTooltip
                  className="ml-auto"
                  icon={<Plus />}
                  tooltip={{
                    content: {
                      side: 'bottom',
                      text: 'Create a publication',
                    },
                  }}
                  onClick={() => setShowCreatePublicationModal(true)}
                >
                  New Publication
                </ButtonTooltip>
              </div>
              <div className="my-4 w-full">
                <Table
                  head={[
                    <Table.th key="name">Name</Table.th>,
                    <Table.th key="tables">Num Tables</Table.th>,
                    <Table.th key="edit">Edit</Table.th>,
                    <Table.th key="delete">Delete</Table.th>,
                  ]}
                  body={
                    publications.length === 0 ? (
                      <Table.tr>
                        <Table.td align="center" colSpan={4}>
                          No publications
                        </Table.td>
                      </Table.tr>
                    ) : (
                      publications.map((pub) => (
                        <Table.tr key={pub.name}>
                          <Table.td>{pub.name}</Table.td>
                          <Table.td>{pub.tables.length}</Table.td>
                          <Table.td>
                            <Button
                              type="default"
                              onClick={() => {
                                toast.info('Editing a publication is not yet implemented')
                              }}
                            >
                              Edit
                            </Button>
                          </Table.td>
                          <Table.td>
                            <Button
                              type="danger"
                              onClick={() => {
                                setPublicationToDelete(pub.name)
                                setShowDeletePublicationModal(true)
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
      <CreatePublicationModal
        visible={showCreatePublicationModal}
        sourceId={thisProjectSource!.id}
        onClose={() => setShowCreatePublicationModal(false)}
      />
      <DeletePublicationModal
        visible={showDeletePublicationModal}
        title={`Delete publication "${publicationToDelete}"`}
        publicationName={publicationToDelete}
        sourceId={thisProjectSource!.id}
        onClose={() => setShowDeletePublicationModal(false)}
      />
    </>
  )
}
