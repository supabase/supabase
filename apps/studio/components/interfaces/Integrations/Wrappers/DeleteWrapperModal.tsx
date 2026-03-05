import { useParams } from 'common'
import { useFDWDeleteMutation } from 'data/fdw/fdw-delete-mutation'
import { useFDWsQuery } from 'data/fdw/fdws-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { Modal } from 'ui'

import { INTEGRATIONS } from '../Landing/Integrations.constants'
import { getWrapperMetaForWrapper, wrapperMetaComparator } from './Wrappers.utils'

export const DeleteWrapperModal = () => {
  const { id, ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const integration = INTEGRATIONS.find((i) => i.id === id)

  const { data, isSuccess } = useFDWsQuery({
    projectRef: ref,
    connectionString: project?.connectionString,
  })

  const wrappers = useMemo(
    () =>
      integration && integration.type === 'wrapper' && data
        ? data.filter((wrapper) => wrapperMetaComparator(integration.meta, wrapper))
        : [],
    [data, integration]
  )

  const [selectedWrapperIdToDelete, setSelectedWrapperToDelete] = useQueryState(
    'delete',
    parseAsString
  )
  const selectedWrapper = wrappers.find((x) => x.id.toString() === selectedWrapperIdToDelete)

  const {
    mutate: deleteFDW,
    isPending: isDeleting,
    isSuccess: isSuccessDelete,
  } = useFDWDeleteMutation({
    onSuccess: () => {
      toast.success(`Successfully disabled ${selectedWrapper?.name} foreign data wrapper`)
      setSelectedWrapperToDelete(null)
    },
  })
  const wrapperMeta = getWrapperMetaForWrapper(selectedWrapper)

  const onConfirmDelete = async () => {
    if (!project?.ref) return console.error('Project ref is required')
    if (!selectedWrapper) return console.error('Wrapper is required')
    if (!wrapperMeta) return console.error('Wrapper meta is required')

    deleteFDW({
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      wrapper: selectedWrapper,
      wrapperMeta: wrapperMeta,
    })
  }

  useEffect(() => {
    if (isSuccess && !!selectedWrapperIdToDelete && !selectedWrapper && !isSuccessDelete) {
      toast('Wrapper not found')
      setSelectedWrapperToDelete(null)
    }
  }, [
    isSuccess,
    isSuccessDelete,
    selectedWrapper,
    selectedWrapperIdToDelete,
    setSelectedWrapperToDelete,
  ])

  return (
    <Modal
      size="medium"
      variant="danger"
      alignFooter="right"
      loading={isDeleting}
      visible={selectedWrapper !== undefined}
      onCancel={() => setSelectedWrapperToDelete(null)}
      onConfirm={() => onConfirmDelete()}
      header={`Confirm to disable ${selectedWrapper?.name}`}
    >
      <Modal.Content>
        <p className="text-sm">
          Are you sure you want to disable {selectedWrapper?.name}? This will also remove all tables
          created with this wrapper.
        </p>
      </Modal.Content>
    </Modal>
  )
}
