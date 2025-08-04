import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useMemo } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { CreateReportModal } from 'components/interfaces/Reports/CreateReportModal'
import { UpdateCustomReportModal } from 'components/interfaces/Reports/UpdateModal'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useContentDeleteMutation } from 'data/content/content-delete-mutation'
import { Content, useContentQuery } from 'data/content/content-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useProfile } from 'lib/profile'
import { Menu, cn } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { ReportMenuItem } from './ReportMenuItem'
import { useFlag } from 'hooks/ui/useFlag'

const ReportsMenu = () => {
  const router = useRouter()
  const { profile } = useProfile()
  const { ref, id } = useParams()
  const pageKey = (id || router.pathname.split('/')[4]) as string
  const authEnabled = useFlag('authreportv2')
  const edgeFnEnabled = useFlag('edgefunctionreport')
  const realtimeEnabled = useFlag('realtimeReport')
  const storageReportEnabled = useFlag('storagereport')
  const postgrestReportEnabled = useFlag('postgrestreport')

  // b/c fly doesn't support storage
  const storageSupported = useIsFeatureEnabled('project_storage:all')
  const storageEnabled = storageReportEnabled && storageSupported

  const canCreateCustomReport = useCheckPermissions(PermissionAction.CREATE, 'user_content', {
    resource: { type: 'report', owner_id: profile?.id },
    subject: { id: profile?.id },
  })

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

  const menuItems = [
    {
      title: 'Built-in reports',
      key: 'builtin-reports',
      items: [
        {
          name: 'API Gateway',
          key: 'api-overview',
          url: `/project/${ref}/reports/api-overview${preservedQueryParams}`,
        },
        ...(authEnabled
          ? [
              {
                name: 'Auth',
                key: 'auth',
                url: `/project/${ref}/reports/auth${preservedQueryParams}`,
              },
            ]
          : []),
        {
          name: 'Database',
          key: 'database',
          url: `/project/${ref}/reports/database${preservedQueryParams}`,
        },
        ...(edgeFnEnabled
          ? [
              {
                name: 'Edge Functions',
                key: 'edge-functions',
                url: `/project/${ref}/reports/edge-functions${preservedQueryParams}`,
              },
            ]
          : []),
        ...(postgrestReportEnabled
          ? [
              {
                name: 'PostgREST',
                key: 'postgrest',
                url: `/project/${ref}/reports/postgrest${preservedQueryParams}`,
              },
            ]
          : []),
        ...(realtimeEnabled
          ? [
              {
                name: 'Realtime',
                key: 'realtime',
                url: `/project/${ref}/reports/realtime${preservedQueryParams}`,
              },
            ]
          : []),

        ...(storageEnabled
          ? [
              {
                name: 'Storage',
                key: 'storage',
                url: `/project/${ref}/reports/storage${preservedQueryParams}`,
              },
            ]
          : []),
      ],
    },
  ]

  return (
    <Menu type="pills" className="mt-6">
      {isLoading ? (
        <div className="px-5 my-4 space-y-2">
          <ShimmeringLoader />
          <ShimmeringLoader className="w-3/4" />
          <ShimmeringLoader className="w-1/2" />
        </div>
      ) : (
        <div className="flex flex-col px-2 gap-y-6">
          <div className="px-2">
            <ButtonTooltip
              block
              type="default"
              icon={<Plus />}
              disabled={!canCreateCustomReport}
              className="justify-start flex-grow"
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
          </div>

          {reportMenuItems.length > 0 ? (
            <div>
              <Menu.Group
                title={<span className="uppercase font-mono">Your custom reports</span>}
              />
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
            </div>
          ) : null}

          {menuItems.map((item) => (
            <div key={item.key + '-menu-group'}>
              {item.items ? (
                <>
                  <Menu.Group title={<span className="uppercase font-mono">{item.title}</span>} />
                  <div key={item.key} className="flex flex-col">
                    {item.items.map((subItem) => (
                      <li
                        key={subItem.key}
                        className={cn(
                          'pr-2 mt-1 text-foreground-light group-hover:text-foreground/80 text-sm',
                          'flex items-center justify-between rounded-md group relative',
                          subItem.key === pageKey
                            ? 'bg-surface-300 text-foreground'
                            : 'hover:bg-surface-200'
                        )}
                      >
                        <Link href={subItem.url} className="flex-grow h-7 flex items-center pl-3">
                          {subItem.name}
                        </Link>
                      </li>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          ))}

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
