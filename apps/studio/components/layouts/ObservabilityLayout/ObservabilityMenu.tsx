import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/router'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { useState } from 'react'
import { toast } from 'sonner'
import { Menu } from 'ui'
import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'
import { InnerSideBarEmptyPanel } from 'ui-patterns/InnerSideMenu'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import {
  useGenerateCustomReportsMenu,
  useGenerateObservabilityMenu,
} from './ObservabilityMenu.utils'
import { ObservabilityMenuItem } from './ObservabilityMenuItem'
import { CreateReportModal } from '@/components/interfaces/Reports/CreateReportModal'
import { UpdateCustomReportModal } from '@/components/interfaces/Reports/UpdateModal'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { ProductMenu } from '@/components/ui/ProductMenu'
import { ProductMenuShortcuts } from '@/components/ui/ProductMenu/ProductMenuShortcuts'
import { useContentDeleteMutation } from '@/data/content/content-delete-mutation'
import { Content } from '@/data/content/content-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { IS_PLATFORM } from '@/lib/constants'
import { useProfile } from '@/lib/profile'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

export const ObservabilityMenu = () => {
  const router = useRouter()
  const { profile } = useProfile()
  const { ref, id } = useParams()
  const pageKey = (id || router.pathname.split('/')[4] || 'observability') as string

  const menuItems = useGenerateObservabilityMenu()
  const { data: customReportItems, isLoading } = useGenerateCustomReportsMenu()

  const { can: canCreateCustomReport } = useAsyncCheckPermissions(
    PermissionAction.CREATE,
    'user_content',
    {
      resource: { type: 'report', owner_id: profile?.id },
      subject: { id: profile?.id },
    }
  )

  const { mutateAsync: deleteReport } = useContentDeleteMutation({
    // Toasts are driven by toast.promise in onConfirmDeleteReport. This no-op keeps the hook
    // from showing its own default error toast, while its optimistic rollback still runs.
    onError: () => {},
  })

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [showNewReportModal, setShowNewReportModal] = useQueryState(
    'newReport',
    parseAsBoolean.withDefault(false).withOptions({ history: 'push', clearOnDefault: true })
  )
  const [selectedReportToDelete, setSelectedReportToDelete] = useState<Content>()
  const [selectedReportToUpdate, setSelectedReportToUpdate] = useState<Content>()

  const onConfirmDeleteReport = () => {
    if (ref === undefined) return console.error('Project ref is required')
    if (selectedReportToDelete?.id === undefined) return console.error('Report ID is required')
    const reportId = selectedReportToDelete.id
    const isViewingDeletedReport = id === reportId
    setDeleteModalOpen(false)

    const deletion = deleteReport({ projectRef: ref, ids: [reportId] })
    toast.promise(deletion, {
      loading: 'Deleting report...',
      success: 'Report deleted',
      error: (err) => `Failed to delete report: ${err?.message ?? 'Unknown error'}`,
    })

    // Only navigate away when the open report is the one deleted, and only after it
    // succeeds so a failed delete (which rolls the cache back) doesn't strand the route.
    deletion
      .then(() => {
        if (isViewingDeletedReport) router.push(`/project/${ref}/observability`)
      })
      .catch(() => {
        // Error is already surfaced by toast.promise; keep the user on the current route.
      })
  }

  useShortcut(
    SHORTCUT_IDS.OBSERVABILITY_NEW_REPORT,
    () => {
      setShowNewReportModal(true)
    },
    { enabled: IS_PLATFORM && canCreateCustomReport }
  )

  return (
    <div>
      <ProductMenuShortcuts menu={menuItems} />
      {isLoading ? (
        <div className="px-5 my-4 space-y-2">
          <ShimmeringLoader />
          <ShimmeringLoader className="w-3/4" />
          <ShimmeringLoader className="w-1/2" />
        </div>
      ) : (
        <div className="flex flex-col gap-y-6">
          <ProductMenu
            page={pageKey}
            menu={menuItems.map((item) => ({
              ...item,
              items: item.items.map((subItem) => ({ ...subItem, items: [] })),
            }))}
          />

          {IS_PLATFORM && (
            <>
              <div className="h-px w-full bg-border-overlay" />
              <div className="mx-2">
                <Menu type="pills">
                  <Menu.Group
                    title={
                      <span className="flex w-full items-center justify-between relative h-6">
                        <span className="uppercase font-mono">Custom Reports</span>
                        {customReportItems.length > 0 && (
                          <ButtonTooltip
                            variant="default"
                            size="tiny"
                            icon={<Plus />}
                            disabled={!canCreateCustomReport}
                            className="flex items-center justify-center h-6 w-6 absolute top-0 -right-1"
                            onClick={() => {
                              setShowNewReportModal(true)
                            }}
                            tooltip={{
                              content: {
                                side: 'bottom',
                                text: !canCreateCustomReport
                                  ? 'You need additional permissions to create custom reports'
                                  : undefined,
                              },
                            }}
                          />
                        )}
                      </span>
                    }
                  />
                  {customReportItems.length > 0 &&
                    customReportItems.map((item) => (
                      <ObservabilityMenuItem
                        key={item.id}
                        item={item}
                        pageKey={pageKey}
                        onSelectEdit={() => {
                          setSelectedReportToUpdate(item.report)
                        }}
                        onSelectDelete={() => {
                          setSelectedReportToDelete(item.report)
                          setDeleteModalOpen(true)
                        }}
                      />
                    ))}
                </Menu>
                {customReportItems.length === 0 ? (
                  <div className="px-2">
                    <InnerSideBarEmptyPanel
                      title="No custom reports yet"
                      description="Create and save custom reports to track your project metrics"
                      actions={
                        <ButtonTooltip
                          variant="default"
                          icon={<Plus />}
                          disabled={!canCreateCustomReport}
                          onClick={() => {
                            setShowNewReportModal(true)
                          }}
                          tooltip={{
                            content: {
                              side: 'bottom',
                              text: !canCreateCustomReport
                                ? 'You need additional permissions to create custom reports'
                                : undefined,
                            },
                          }}
                        >
                          New custom report
                        </ButtonTooltip>
                      }
                    />
                  </div>
                ) : null}
              </div>
            </>
          )}

          <UpdateCustomReportModal
            onCancel={() => setSelectedReportToUpdate(undefined)}
            selectedReport={selectedReportToUpdate}
            initialValues={{
              name: selectedReportToUpdate?.name || '',
              description: selectedReportToUpdate?.description || '',
            }}
          />

          <ConfirmationModal
            title="Delete custom report"
            confirmLabel="Delete report"
            size="medium"
            loading={false}
            visible={deleteModalOpen}
            onCancel={() => setDeleteModalOpen(false)}
            onConfirm={onConfirmDeleteReport}
          >
            <div className="text-sm text-foreground-light grid gap-4">
              <div className="grid gap-1">
                <p>Are you sure you want to delete '{selectedReportToDelete?.name}'?</p>
              </div>
            </div>
          </ConfirmationModal>

          <CreateReportModal
            visible={showNewReportModal}
            onCancel={() => setShowNewReportModal(false)}
            afterSubmit={() => setShowNewReportModal(false)}
          />
        </div>
      )}
    </div>
  )
}
