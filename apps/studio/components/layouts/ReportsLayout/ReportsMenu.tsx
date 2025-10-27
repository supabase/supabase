import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { CreateReportModal } from 'components/interfaces/Reports/CreateReportModal'
import { UpdateCustomReportModal } from 'components/interfaces/Reports/UpdateModal'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useContentDeleteMutation } from 'data/content/content-delete-mutation'
import { Content, useContentQuery } from 'data/content/content-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useProfile } from 'lib/profile'
import { Menu } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { ReportMenuItem } from './ReportMenuItem'
import { InnerSideBarEmptyPanel } from 'ui-patterns'

const ReportsMenu = () => {
  const router = useRouter()
  const { profile } = useProfile()
  const { ref, id } = useParams()
  const pageKey = (id || router.pathname.split('/')[4]) as string

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

  const { data: content, isLoading } = useContentQuery({
    projectRef: ref,
    type: 'report',
  })
  const { mutate: deleteReport, isLoading: isDeleting } = useContentDeleteMutation({
    onSuccess: () => {
      setDeleteModalOpen(false)
      toast.success('Successfully deleted report')
      router.push(`/project/${ref}/reports`)
    },
    onError: (error) => {
      toast.error(`Failed to delete report: ${error.message}`)
    },
  })

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [showNewReportModal, setShowNewReportModal] = useState(false)
  const [selectedReportToDelete, setSelectedReportToDelete] = useState<Content>()
  const [selectedReportToUpdate, setSelectedReportToUpdate] = useState<Content>()

  const onConfirmDeleteReport = () => {
    if (ref === undefined) return console.error('Project ref is required')
    if (selectedReportToDelete?.id === undefined) return console.error('Report ID is required')
    deleteReport({ projectRef: ref, ids: [selectedReportToDelete.id] })
  }

  function getReportMenuItems() {
    if (!content) return []

    const reports = content?.content.filter((c) => c.type === 'report')

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
      url: `/project/${ref}/reports/${r.id}${preservedQueryParams}`,
      hasDropdownActions: true,
      report: r,
    }))

    return reportMenuItems
  }

  const reportMenuItems = getReportMenuItems()

  return (
    <Menu type="pills" className="mt-6">
      {isLoading ? (
        <div className="px-5 my-4 space-y-2">
          <ShimmeringLoader />
          <ShimmeringLoader className="w-3/4" />
          <ShimmeringLoader className="w-1/2" />
        </div>
      ) : (
        <div className="my-6 space-y-8">
          <div className="mx-2">
            <Menu.Group
              title={
                <span className="flex w-full items-center justify-between relative h-6">
                  <span className="uppercase font-mono">My Reports</span>
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
            ) : (
              <>
                {reportMenuItems.map((item) => (
                  <ReportMenuItem
                    key={item.id}
                    item={item as any}
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
              </>
            )}
          </div>

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
    </Menu>
  )
}

export default ReportsMenu
