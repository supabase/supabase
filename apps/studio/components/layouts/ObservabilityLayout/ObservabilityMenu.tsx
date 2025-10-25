import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useFlag, useParams } from 'common'
import { CreateReportModal } from 'components/interfaces/Reports/CreateReportModal'
import { UpdateCustomReportModal } from 'components/interfaces/Reports/UpdateModal'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useContentDeleteMutation } from 'data/content/content-delete-mutation'
import { Content, useContentQuery } from 'data/content/content-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useProfile } from 'lib/profile'
import { Menu, cn } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { ReportMenuItem } from '../ReportsLayout/ReportMenuItem'

const ObservabilityMenu = () => {
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

  const menuItems = [
    {
      title: 'Performance Reports',
      key: 'performance-reports',
      items: [
        {
          name: 'API Gateway',
          key: 'api-overview',
          url: `/project/${ref}/observability/api-overview${preservedQueryParams}`,
        },
        {
          name: 'Query Performance',
          key: 'query-performance',
          url: `/project/${ref}/observability/query-performance${preservedQueryParams}`,
        },
        ...(postgrestReportEnabled
          ? [
              {
                name: 'Data API',
                key: 'data-api',
                url: `/project/${ref}/observability/postgrest${preservedQueryParams}`,
              },
            ]
          : []),
      ],
    },
    {
      title: 'Product Reports',
      key: 'product-reports',
      items: [
        ...(authEnabled
          ? [
              {
                name: 'Auth',
                key: 'auth',
                url: `/project/${ref}/observability/auth${preservedQueryParams}`,
              },
            ]
          : []),
        {
          name: 'Database',
          key: 'database',
          url: `/project/${ref}/observability/database${preservedQueryParams}`,
        },
        ...(edgeFnEnabled
          ? [
              {
                name: 'Edge Functions',
                key: 'edge-functions',
                url: `/project/${ref}/observability/edge-functions${preservedQueryParams}`,
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
        ...(storageEnabled
          ? [
              {
                name: 'Storage',
                key: 'storage',
                url: `/project/${ref}/observability/storage${preservedQueryParams}`,
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
            <>
              <div className="h-px w-full bg-border-overlay first:hidden" />
              <div key={item.key + '-menu-group'}>
                {item.items ? (
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
                              : 'hover:bg-surface-200'
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
            </>
          ))}
        </div>
      )}
    </Menu>
  )
}

export default ObservabilityMenu
