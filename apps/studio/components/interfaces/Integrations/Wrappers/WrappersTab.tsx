import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { useCallback, useState } from 'react'
import { Sheet, SheetContent } from 'ui'

import { AddWrapperButton } from './AddWrapperButton'
import { CreateWrapperSheet } from './CreateWrapperSheet'
import { WRAPPERS } from './Wrappers.constants'
import { wrapperMetaComparator } from './Wrappers.utils'
import { WrapperTable } from './WrapperTable'
import { DiscardChangesConfirmationDialog } from '@/components/ui-patterns/Dialogs/DiscardChangesConfirmationDialog'
import { DocsButton } from '@/components/ui/DocsButton'
import { useFDWsQuery } from '@/data/fdw/fdws-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useConfirmOnClose } from '@/hooks/ui/useConfirmOnClose'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

export const WrappersTab = () => {
  const { id } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const [isCreating, setIsCreating] = useQueryState(
    'new',
    parseAsBoolean.withDefault(false).withOptions({ clearOnDefault: true })
  )

  const { can: canCreateWrapper } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'wrappers'
  )

  useShortcut(SHORTCUT_IDS.LIST_PAGE_NEW_ITEM, () => setIsCreating(true), {
    label: 'Add new wrapper',
    enabled: canCreateWrapper,
  })

  const { data } = useFDWsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const wrappers = data ?? []
  const wrapperMeta = WRAPPERS.find((w) => w.name === id)

  const createdWrappers = wrapperMeta
    ? wrappers.filter((w) => wrapperMetaComparator(wrapperMeta, w))
    : []

  const [isDirty, setIsDirty] = useState(false)
  const { confirmOnClose, handleOpenChange, modalProps } = useConfirmOnClose({
    checkIsDirty: useCallback(() => isDirty, [isDirty]),
    onClose: useCallback(() => {
      setIsCreating(null)
      setIsDirty(false)
    }, [setIsCreating]),
  })

  if (!wrapperMeta) {
    return <div>Missing integration.</div>
  }

  return (
    <div className="w-full p-10">
      {createdWrappers.length === 0 ? (
        <div className="w-full h-48 max-w-4xl">
          <div className="border rounded-lg h-full flex flex-col gap-y-2 items-center justify-center">
            <p className="text-sm text-foreground-light">
              No {wrapperMeta.label} wrappers have been installed
            </p>
            <AddWrapperButton onClick={() => setIsCreating(true)} />
          </div>
        </div>
      ) : (
        <>
          <div className="max-w-5xl flex items-center gap-x-2 justify-end mb-4">
            <DocsButton href={wrapperMeta.docsUrl} />
            <AddWrapperButton variant="primary" onClick={() => setIsCreating(true)} />
          </div>
          <WrapperTable />
        </>
      )}

      <Sheet open={!!isCreating} onOpenChange={handleOpenChange}>
        <SheetContent size="lg" tabIndex={undefined}>
          {wrapperMeta && (
            <CreateWrapperSheet
              wrapperMeta={wrapperMeta}
              onDirty={setIsDirty}
              onClose={() => {
                setIsCreating(null)
                setIsDirty(false)
              }}
              onCloseWithConfirmation={confirmOnClose}
            />
          )}
        </SheetContent>
      </Sheet>

      <DiscardChangesConfirmationDialog {...modalProps} />
    </div>
  )
}
