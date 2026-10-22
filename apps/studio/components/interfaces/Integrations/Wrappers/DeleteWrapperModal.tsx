import { useParams } from 'common'
import { parseAsString } from 'nuqs'
import { useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from 'ui'

import { INTEGRATIONS } from '../Landing/Integrations.constants'
import { getWrapperMetaForWrapper, wrapperMetaComparator } from './Wrappers.utils'
import { useFDWDeleteMutation } from '@/data/fdw/fdw-delete-mutation'
import { useFDWsQuery } from '@/data/fdw/fdws-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { usePanelQueryState } from '@/hooks/ui/usePanelQueryState'
import { missingPanelIdAction } from '@/lib/panel-history.utils'

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

  const [selectedWrapperIdToDelete, setSelectedWrapperToDelete] = usePanelQueryState(
    'delete',
    parseAsString.withOptions({ history: 'push' })
  )
  const selectedWrapper = wrappers.find((x) => x.id.toString() === selectedWrapperIdToDelete)

  const {
    mutateAsync: deleteFDW,
    isSuccess: isSuccessDelete,
    variables: deletedWrapper,
  } = useFDWDeleteMutation({
    onSuccess: () => {
      toast.success('Connection deleted')
      setSelectedWrapperToDelete(null)
    },
  })
  const wrapperMeta = getWrapperMetaForWrapper(selectedWrapper)

  const onConfirmDelete = async () => {
    if (!project?.ref) return console.error('Project ref is required')
    if (!selectedWrapper) return console.error('Wrapper is required')
    if (!wrapperMeta) return console.error('Wrapper meta is required')

    await deleteFDW({
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      wrapper: selectedWrapper,
      wrapperMeta: wrapperMeta,
    })
  }

  useEffect(() => {
    const action = missingPanelIdAction({
      listLoaded: isSuccess,
      currentId: selectedWrapperIdToDelete,
      resourceFound: !!selectedWrapper,
      isSuccessDelete,
      deletedId: deletedWrapper?.wrapper?.id,
    })

    if (action === 'keep') return
    if (action === 'clear-and-notify') toast('Wrapper not found')
    setSelectedWrapperToDelete(null, { history: 'replace' })
  }, [
    deletedWrapper,
    isSuccess,
    isSuccessDelete,
    selectedWrapper,
    selectedWrapperIdToDelete,
    setSelectedWrapperToDelete,
  ])

  return (
    <AlertDialog
      open={selectedWrapper !== undefined}
      onOpenChange={() => setSelectedWrapperToDelete(null)}
    >
      <AlertDialogContent size="small">
        <AlertDialogHeader>
          <AlertDialogTitle>{`Delete connection ${selectedWrapper?.server_name}?`}</AlertDialogTitle>
          <AlertDialogDescription>
            This deletes this connection and its foreign tables. If this is the last connection
            using the wrapper, its Vault secret and wrapper are also removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="danger" onClick={onConfirmDelete}>
            Delete connection
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
