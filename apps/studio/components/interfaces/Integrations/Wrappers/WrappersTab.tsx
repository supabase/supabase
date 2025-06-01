import { PermissionAction } from '@supabase/shared-types/out/constants'
import { HTMLProps, ReactNode, useCallback, useState } from 'react'

import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { FDW, useFDWsQuery } from 'data/fdw/fdws-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { Sheet, SheetContent } from 'ui'
import { INTEGRATIONS } from '../Landing/Integrations.constants'
import { CreateWrapperSheet } from './CreateWrapperSheet'
import { WrapperTable } from './WrapperTable'
import DeleteWrapperModal from './DeleteWrapperModal'
import { wrapperMetaComparator } from './Wrappers.utils'

export const WrappersTab = () => {
  const { id } = useParams()
  const { project } = useProjectContext()
  const [selectedWrapperForDelete, setSelectedWrapperForDelete] = useState<FDW | null>(null)
  const [createWrapperShown, setCreateWrapperShown] = useState(false)
  const [isClosingCreateWrapper, setisClosingCreateWrapper] = useState(false)
  const canCreateWrapper = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'wrappers')

  const { data } = useFDWsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const wrappers = data ?? []
  const integration = INTEGRATIONS.find((i) => i.id === id)

  // this contains a collection of all wrapper instances for the wrapper type
  const createdWrappers =
    integration?.type === 'wrapper'
      ? wrappers.filter((w) => wrapperMetaComparator(integration.meta, w))
      : []

  const Container = useCallback(
    ({ ...props }: { children: ReactNode } & HTMLProps<HTMLDivElement>) => (
      <div className="w-full mx-10 py-10 ">
        {props.children}
        <Sheet open={!!createWrapperShown} onOpenChange={() => setisClosingCreateWrapper(true)}>
          <SheetContent size="lg" tabIndex={undefined}>
            {integration?.type === 'wrapper' && (
              <CreateWrapperSheet
                wrapperMeta={integration.meta}
                onClose={() => {
                  setCreateWrapperShown(false)
                  setisClosingCreateWrapper(false)
                }}
                isClosing={isClosingCreateWrapper}
                setIsClosing={setisClosingCreateWrapper}
              />
            )}
          </SheetContent>
        </Sheet>
      </div>
    ),
    [createWrapperShown, integration, isClosingCreateWrapper]
  )

  if (!integration || integration.type !== 'wrapper') {
    return <div>Missing integration.</div>
  }

  if (createdWrappers.length === 0) {
    return (
      <Container>
        <div className=" w-full h-48 max-w-4xl">
          <div className="border rounded-lg h-full flex flex-col gap-y-2 items-center justify-center">
            <p className="text-sm text-foreground-light">
              No {integration.meta.label} wrappers have been installed
            </p>
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
      <WrapperTable />
      {selectedWrapperForDelete && (
        <DeleteWrapperModal
          selectedWrapper={selectedWrapperForDelete}
          onClose={() => setSelectedWrapperForDelete(null)}
        />
      )}
    </Container>
  )
}
