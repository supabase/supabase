import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { useRouter } from 'next/router'
import { HTMLProps, ReactNode, useCallback, useEffect, useState } from 'react'
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
  const router = useRouter()
  const { data: project } = useSelectedProjectQuery()

  const [isCreating, setIsCreating] = useQueryState(
    'new',
    parseAsBoolean.withDefault(false).withOptions({ clearOnDefault: true })
  )

  const { can: canCreateWrapper } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'wrappers'
  )

  useEffect(() => {
    if (router.query.action === 'new' && canCreateWrapper) {
      setCreateWrapperShown(true)
      const { action: _, ...remainingQuery } = router.query
      router.replace({ pathname: router.pathname, query: remainingQuery }, undefined, {
        shallow: true,
      })
    }
  }, [router.query.action, canCreateWrapper])

  useShortcut(SHORTCUT_IDS.LIST_PAGE_NEW_ITEM, () => setCreateWrapperShown(true), {
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
            <AddWrapperButton onClick={() => setCreateWrapperShown(true)} />
          </div>
        </div>
      ) : (
        <div className="max-w-5xl flex items-center gap-x-2 justify-end mb-4">
          <DocsButton href={wrapperMeta.docsUrl} />
          <ButtonTooltip
            type="primary"
            onClick={() => setIsCreating(true)}
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
      )}

      {createdWrappers.length > 0 && <WrapperTable />}

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

  return (
    <Container>
      <div className="max-w-5xl flex items-center gap-x-2 justify-end mb-4">
        <DocsButton href={wrapperMeta.docsUrl} />
        <AddWrapperButton type="primary" onClick={() => setCreateWrapperShown(true)} />
      </div>
      <WrapperTable />
      <DiscardChangesConfirmationDialog {...modalProps} />
    </div>
  )
}
