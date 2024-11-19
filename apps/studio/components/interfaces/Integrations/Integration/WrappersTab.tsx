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
import { CreateWrapperSheet } from './CreateWrapperSheet'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { PermissionAction } from '@supabase/shared-types/out/constants'

export const WrappersTab = () => {
  const { id } = useParams()
  const { project } = useProjectContext()
  const [editWrapperShown, setEditWrapperShown] = useState(false)
  const [isClosingEditWrapper, setisClosingEditWrapper] = useState(false)
  const [selectedWrapper, setSelectedWrapper] = useState<FDW | null>(null)
  const [selectedWrapperForDelete, setSelectedWrapperForDelete] = useState<FDW | null>(null)
  const [createWrapperShown, setCreateWrapperShown] = useState(false)
  const [isClosingCreateWrapper, setisClosingCreateWrapper] = useState(false)
  const canCreateWrapper = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'wrappers')

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

  const Container = ({
    ...props
  }: { children: React.ReactNode } & React.HTMLProps<HTMLDivElement>) => (
    <div className=" w-full h-48 mx-10 py-10">
      {props.children}
      <Sheet open={!!createWrapperShown} onOpenChange={() => setisClosingCreateWrapper(true)}>
        <SheetContent size="default" tabIndex={undefined}>
          <CreateWrapperSheet
            wrapperMeta={integration.meta}
            onClose={() => {
              setCreateWrapperShown(false)
              setisClosingCreateWrapper(false)
            }}
            isClosing={isClosingCreateWrapper}
            setIsClosing={setisClosingCreateWrapper}
          />
        </SheetContent>
      </Sheet>
    </div>
  )

  if (createdWrappers.length === 0) {
    return (
      <Container>
        <div className=" w-full h-48 max-w-3xl">
          <div className="border rounded-lg h-full flex items-center justify-center">
            No wrappers are installed.
            <ButtonTooltip
              type="default"
              onClick={() => setCreateWrapperShown(true)}
              disabled={!canCreateWrapper}
              tooltip={{
                content: {
                  text: !canCreateWrapper
                    ? 'You need additional permissions to create a foreign data wrapper'
                    : undefined,
                },
              }}
            >
              Add new wrapper
            </ButtonTooltip>
          </div>
        </div>
      </Container>
    )
  }

  return (
    <Container>
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
    </Container>
  )
}
