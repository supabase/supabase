import { useParams } from 'common'
import DeleteWrapperModal from 'components/interfaces/Database/Wrappers/DeleteWrapperModal'
import { wrapperMetaComparator } from 'components/interfaces/Database/Wrappers/Wrappers.utils'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { FDW, useFDWsQuery } from 'data/fdw/fdws-query'
import { useState } from 'react'
import { Sheet, SheetContent } from 'ui'
import { INTEGRATIONS } from '../Landing/Integrations.constants'
import { EditWrapperSheet } from './EditWrapperSheet'
import WrapperRow from './WrapperRow'

export const WrappersTab = () => {
  const { id } = useParams()
  const { project } = useProjectContext()
  const [editWrapperShown, setEditWrapperShown] = useState(false)
  const [isClosingEditWrapper, setisClosingEditWrapper] = useState(false)
  const [selectedWrapper, setSelectedWrapper] = useState<FDW | null>(null)
  const [selectedWrapperForDelete, setSelectedWrapperForDelete] = useState<FDW | null>(null)

  const { data, isLoading } = useFDWsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const wrappers = data?.result || []

  if (isLoading) {
    return <div>Loading</div>
  }

  const integration = INTEGRATIONS.find((i) => i.id === id)

  if (!integration || integration.type !== 'wrapper') {
    return <div>Missing integration.</div>
  }

  // this contains a collection of all wrapper instances for the wrapper type
  const createdWrappers = wrappers.filter((w) => wrapperMetaComparator(integration.meta, w))

  if (createdWrappers.length === 0) {
    return (
      <div className=" w-full h-48">
        <div className="border rounded-lg h-full">No wrappers are installed.</div>
      </div>
    )
  }

  return (
    <>
      <WrapperRow
        key={integration.id}
        wrapperMeta={integration.meta}
        wrappers={createdWrappers}
        isOpen={true}
        onOpen={() => {}}
        onEdit={(w) => {
          setEditWrapperShown(true)
          setSelectedWrapper(w)
        }}
        onSelectDelete={(w) => setSelectedWrapperForDelete(w)}
      />
      <Sheet open={!!editWrapperShown} onOpenChange={() => setisClosingEditWrapper(true)}>
        <SheetContent size="default" tabIndex={undefined}>
          <EditWrapperSheet
            wrapper={selectedWrapper!}
            wrapperMeta={integration.meta}
            onClose={() => {
              setEditWrapperShown(false)
              setisClosingEditWrapper(false)
            }}
            isClosing={isClosingEditWrapper}
            setIsClosing={setisClosingEditWrapper}
          />
        </SheetContent>
      </Sheet>

      {selectedWrapperForDelete && (
        <DeleteWrapperModal
          selectedWrapper={selectedWrapperForDelete}
          onClose={() => setSelectedWrapperForDelete(null)}
        />
      )}
    </>
  )
}
