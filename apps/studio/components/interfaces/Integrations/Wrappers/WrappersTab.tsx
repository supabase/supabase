import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useFDWsQuery } from 'data/fdw/fdws-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useConfirmOnClose, type ConfirmOnCloseModalProps } from 'hooks/ui/useConfirmOnClose'
import { HTMLProps, ReactNode, useCallback, useState } from 'react'
import { Sheet, SheetContent } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import { CreateWrapperSheet } from './CreateWrapperSheet'
import { WRAPPERS } from './Wrappers.constants'
import { wrapperMetaComparator } from './Wrappers.utils'
import { WrapperTable } from './WrapperTable'

export const WrappersTab = () => {
  const { id } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const [createWrapperShown, setCreateWrapperShown] = useState(false)

  const { can: canCreateWrapper } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'wrappers'
  )

  const { data } = useFDWsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const wrappers = data ?? []
  const wrapperMeta = WRAPPERS.find((w) => w.name === id)

  // this contains a collection of all wrapper instances for the wrapper type
  const createdWrappers = wrapperMeta
    ? wrappers.filter((w) => wrapperMetaComparator(wrapperMeta, w))
    : []

  const [isDirty, setIsDirty] = useState(false)
  const { confirmOnClose, modalProps: closeConfirmationModalProps } = useConfirmOnClose({
    checkIsDirty: useCallback(() => isDirty, [isDirty]),
    onClose: useCallback(() => {
      setCreateWrapperShown(false)
      setIsDirty(false)
    }, []),
  })

  const Container = useCallback(
    ({ ...props }: { children: ReactNode } & HTMLProps<HTMLDivElement>) => (
      <div className="w-full mx-10 py-10 ">
        {props.children}
        <Sheet open={!!createWrapperShown} onOpenChange={confirmOnClose}>
          <SheetContent size="lg" tabIndex={undefined}>
            {wrapperMeta && (
              <CreateWrapperSheet
                wrapperMeta={wrapperMeta}
                onDirty={setIsDirty}
                onClose={() => setCreateWrapperShown(false)}
                onCloseWithConfirmation={confirmOnClose}
              />
            )}
          </SheetContent>
        </Sheet>
      </div>
    ),
    [createWrapperShown, wrapperMeta, confirmOnClose]
  )

  if (!wrapperMeta) {
    return <div>Missing integration.</div>
  }

  if (createdWrappers.length === 0) {
    return (
      <Container>
        <div className=" w-full h-48 max-w-4xl">
          <div className="border rounded-lg h-full flex flex-col gap-y-2 items-center justify-center">
            <p className="text-sm text-foreground-light">
              No {wrapperMeta.label} wrappers have been installed
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
      <CloseConfirmationModal {...closeConfirmationModalProps} />
    </Container>
  )
}

const CloseConfirmationModal = ({ visible, onClose, onCancel }: ConfirmOnCloseModalProps) => (
  <ConfirmationModal
    visible={visible}
    title="Discard changes"
    confirmLabel="Discard"
    onCancel={onCancel}
    onConfirm={onClose}
  >
    <p className="text-sm text-foreground-light">
      There are unsaved changes. Are you sure you want to close the panel? Your changes will be
      lost.
    </p>
  </ConfirmationModal>
)
