import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useFlag, useParams } from 'common'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/router'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Menu } from 'ui'
import { InnerSideBarEmptyPanel } from 'ui-patterns'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { generateObservabilityMenuItems } from './ObservabilityMenu.utils'
import { ObservabilityMenuItem } from './ObservabilityMenuItem'
import { useSupamonitorStatus } from '@/components/interfaces/QueryPerformance/hooks/useSupamonitorStatus'
import { CreateReportModal } from '@/components/interfaces/Reports/CreateReportModal'
import { UpdateCustomReportModal } from '@/components/interfaces/Reports/UpdateModal'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { ProductMenu } from '@/components/ui/ProductMenu'
import { useContentDeleteMutation } from '@/data/content/content-delete-mutation'
import { Content, ContentBase, useContentQuery } from '@/data/content/content-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { IS_PLATFORM } from '@/lib/constants'
import { useProfile } from '@/lib/profile'
import type { Dashboards } from '@/types'

const ObservabilityMenu = () => {
  const router = useRouter()
  const { profile } = useProfile()
  const { ref, id } = useParams()
  const pageKey = (id || router.pathname.split('/')[4] || 'observability') as string
  const showOverview = useFlag('observabilityOverview')
  const { isSupamonitorEnabled } = useSupamonitorStatus()

  const storageSupported = useIsFeatureEnabled('project_storage:all')

  const { can: canCreateCustomReport } = useAsyncCheckPermissions(
    PermissionAction.CREATE,
    'user_content',
    {
      resource: { type: 'report', owner_id: profile?.id },
      subject: { id: profile?.id },
    }
  )

  // Preserve date range query parameters when navigating
  const preservedQueryParams = useMemo(() => {
    const { its, ite, isHelper, helperText } = router.query
    const params = new URLSearchParams()

    if (its && typeof its === 'string') params.set('its', its)
    if (ite && typeof ite === 'string') params.set('ite', ite)
    if (isHelper && typeof isHelper === 'string') params.set('isHelper', isHelper)
    if (helperText && typeof helperText === 'string') params.set('helperText', helperText)

    const queryString = params.toString()
    return queryString ? `?${queryString}` : ''
  }, [router.query])

  const { data: content, isPending: isLoading } = useContentQuery({
    projectRef: ref,
    type: 'report',
  })
  const { mutate: deleteReport, isPending: isDeleting } = useContentDeleteMutation({
    onSuccess: () => {
      setDeleteModalOpen(false)
      toast.success('Successfully deleted report')
      router.push(`/project/${ref}/observability`)
    },
    onError: (error) => {
      toast.error(`Failed to delete report: ${error.message}`)
    },
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
    deleteReport({ projectRef: ref, ids: [selectedReportToDelete.id] })
  }

  function isReportContent(c: Content): c is ContentBase & {
    type: 'report'
    content: Dashboards.Content
  } {
    return c.type === 'report'
  }

  function getReportMenuItems() {
    if (!content) return []

    const reports = content?.content.filter(isReportContent)

    const sortedReports = reports?.sort((a, b) => {
      if (a.name < b.name) {
        return -1
      }
      if (a.name > b.name) {
        return 1
      }
      return 0
    })

    const reportMenuItems = sortedReports.map((r, idx) => ({
      id: r.id,
      name: r.name,
      description: r.description || '',
      key: r.id || idx + '-report',
      url: `/project/${ref}/observability/${r.id}${preservedQueryParams}`,
      hasDropdownActions: true,
      report: r,
    }))

    return reportMenuItems
  }

  const reportMenuItems = getReportMenuItems()

  const menuItems = generateObservabilityMenuItems({
    ref,
    preservedQueryParams,
    showOverview,
    isSupamonitorEnabled,
    storageSupported,
    isPlatform: IS_PLATFORM,
  })

  return (
    <div>
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
                        {reportMenuItems.length > 0 && (
                          <ButtonTooltip
                            type="default"
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
                  {reportMenuItems.length > 0 &&
                    reportMenuItems.map((item) => (
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
                {reportMenuItems.length === 0 ? (
                  <div className="px-2">
                    <InnerSideBarEmptyPanel
                      title="No custom reports yet"
                      description="Create and save custom reports to track your project metrics"
                      actions={
                        <ButtonTooltip
                          type="default"
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
            confirmLabelLoading="Deleting report"
            size="medium"
            loading={isDeleting}
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

export default ObservabilityMenu
