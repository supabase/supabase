import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useFlag, useParams } from 'common'
import { CreateReportModal } from 'components/interfaces/Reports/CreateReportModal'
import { UpdateCustomReportModal } from 'components/interfaces/Reports/UpdateModal'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useContentDeleteMutation } from 'data/content/content-delete-mutation'
import { Content, ContentBase, useContentQuery } from 'data/content/content-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { IS_PLATFORM } from 'lib/constants'
import { useProfile } from 'lib/profile'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { Fragment, useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { Dashboards } from 'types'
import { Menu, cn } from 'ui'
import { InnerSideBarEmptyPanel } from 'ui-patterns'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { ObservabilityMenuItem } from './ObservabilityMenuItem'

const ObservabilityMenu = () => {
  const router = useRouter()
  const { profile } = useProfile()
  const { ref, id } = useParams()
  const pageKey = (id || router.pathname.split('/')[4] || 'observability') as string
  const showOverview = useFlag('observabilityOverview')
  const authEnabled = useFlag('authreportv2')
  const edgeFnEnabled = useFlag('edgefunctionreport')
  const realtimeEnabled = useFlag('realtimeReport')
  const storageReportEnabled = useFlag('storagereport')
  const postgrestReportEnabled = useFlag('postgrestreport')

  // b/c fly doesn't support storage
  const storageSupported = useIsFeatureEnabled('project_storage:all')
  const storageEnabled = storageReportEnabled && storageSupported

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

  const menuItems = [
    {
      title: 'GENERAL',
      key: 'general-section',
      items: [
        ...(showOverview
          ? [
              {
                name: 'Overview',
                key: 'observability',
                url: `/project/${ref}/observability${preservedQueryParams}`,
              },
            ]
          : []),
        {
          name: 'Query Performance',
          key: 'query-performance',
          url: `/project/${ref}/observability/query-performance${preservedQueryParams}`,
        },
        ...(IS_PLATFORM
          ? [
              {
                name: 'API Gateway',
                key: 'api-overview',
                url: `/project/${ref}/observability/api-overview${preservedQueryParams}`,
              },
            ]
          : []),
      ],
    },
    {
      title: 'PRODUCT',
      key: 'product-section',
      items: [
        ...(IS_PLATFORM
          ? [
              {
                name: 'Database',
                key: 'database',
                url: `/project/${ref}/observability/database${preservedQueryParams}`,
              },
            ]
          : []),
        ...(postgrestReportEnabled
          ? [
              {
                name: 'Data API',
                key: 'postgrest',
                url: `/project/${ref}/observability/postgrest${preservedQueryParams}`,
              },
            ]
          : []),
        ...(authEnabled
          ? [
              {
                name: 'Auth',
                key: 'auth',
                url: `/project/${ref}/observability/auth${preservedQueryParams}`,
              },
            ]
          : []),
        ...(edgeFnEnabled
          ? [
              {
                name: 'Edge Functions',
                key: 'edge-functions',
                url: `/project/${ref}/observability/edge-functions${preservedQueryParams}`,
              },
            ]
          : []),
        ...(storageEnabled
          ? [
              {
                name: 'Storage',
                key: 'storage',
                url: `/project/${ref}/observability/storage${preservedQueryParams}`,
              },
            ]
          : []),
        ...(realtimeEnabled
          ? [
              {
                name: 'Realtime',
                key: 'realtime',
                url: `/project/${ref}/observability/realtime${preservedQueryParams}`,
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
        <div className="flex flex-col gap-y-6">
          {menuItems.map((item, idx) => (
            <Fragment key={idx}>
              <div className="h-px w-full bg-border-overlay first:hidden" />
              <div>
                {item.items && item.items.length > 0 ? (
                  <div className="px-2">
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
                              : 'hover:text-foreground'
                          )}
                        >
                          <Link
                            href={subItem.url}
                            className="flex-grow h-7 flex justify-between items-center pl-3"
                          >
                            <span>{subItem.name}</span>
                          </Link>
                        </li>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </Fragment>
          ))}

          {IS_PLATFORM && (
            <Fragment>
              <div className="h-px w-full bg-border-overlay" />
              <div className="mx-2">
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
                  </>
                )}
              </div>
            </Fragment>
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
    </Menu>
  )
}

export default ObservabilityMenu
