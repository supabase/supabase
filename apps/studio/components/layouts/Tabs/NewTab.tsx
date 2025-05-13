import { PermissionAction } from '@supabase/shared-types/out/constants'
import { partition } from 'lodash'
import { ExternalLink, Table2, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { toast } from 'sonner'

import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { SQL_TEMPLATES } from 'components/interfaces/SQLEditor/SQLEditor.queries'
import { createSqlSnippetSkeletonV2 } from 'components/interfaces/SQLEditor/SQLEditor.utils'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { InlineLinkClassName } from 'components/ui/InlineLink'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { uuidv4 } from 'lib/helpers'
import { useProfile } from 'lib/profile'
import { useAppStateSnapshot } from 'state/app-state'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { getTabsStore } from 'state/tabs'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Badge,
  Button,
  cn,
  SQL_ICON,
  Tabs_Shadcn_,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
} from 'ui'
import { useEditorType } from '../editors/EditorsLayout.hooks'
import { useProjectContext } from '../ProjectLayout/ProjectContext'
import { ActionCard } from './ActionCard'
import { RecentItems } from './RecentItems'

export function NewTab() {
  const router = useRouter()
  const { ref } = useParams()
  const editor = useEditorType()
  const { profile } = useProfile()
  const org = useSelectedOrganization()
  const { project } = useProjectContext()

  const appSnap = useAppStateSnapshot()
  const snap = useTableEditorStateSnapshot()
  const snapV2 = useSqlEditorV2StateSnapshot()

  const [templates] = partition(SQL_TEMPLATES, { type: 'template' })
  const [quickstarts] = partition(SQL_TEMPLATES, { type: 'quickstart' })

  const { mutate: sendEvent } = useSendEventMutation()

  const [tabsInterfaceAcknowledge, setTabsInterfaceAcknowledge] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.TABS_INTERFACE_ACKNOWLEDGED,
    false
  )

  const canCreateSQLSnippet = useCheckPermissions(PermissionAction.CREATE, 'user_content', {
    resource: { type: 'sql', owner_id: profile?.id },
    subject: { id: profile?.id },
  })

  const tableEditorActions = [
    {
      icon: <Table2 className="h-4 w-4 text-foreground" strokeWidth={1.5} />,
      title: 'Create a table',
      description: 'Design and create a new database table',
      bgColor: 'bg-blue-500',
      isBeta: false,
      onClick: snap.onAddTable,
    },
  ]

  const sqlEditorActions = [
    {
      icon: <SQL_ICON className={cn('fill-foreground', 'w-4 h-4')} strokeWidth={1.5} />,
      title: 'New SQL Snippet',
      description: 'Execute SQL queries',
      bgColor: 'bg-green-500',
      isBeta: false,
      onClick: () => router.push(`/project/${ref}/sql/new`),
    },
  ]

  const actions = editor === 'sql' ? sqlEditorActions : tableEditorActions

  const handleNewQuery = async (sql: string, name: string) => {
    if (!ref) return console.error('Project ref is required')
    if (!project) return console.error('Project is required')
    if (!profile) return console.error('Profile is required')

    if (!canCreateSQLSnippet) {
      return toast('Your queries will not be saved as you do not have sufficient permissions')
    }

    try {
      const snippet = createSqlSnippetSkeletonV2({
        id: uuidv4(),
        name,
        sql,
        owner_id: profile?.id,
        project_id: project?.id,
      })
      snapV2.addSnippet({ projectRef: ref, snippet })
      snapV2.addNeedsSaving(snippet.id)

      const store = getTabsStore(ref)
      const tabId = `sql-${snippet.id}`
      store.openTabs = [...store.openTabs, tabId]
      store.tabsMap[tabId] = {
        id: tabId,
        type: 'sql',
        label: name,
        metadata: { sqlId: snippet.id },
      }
      store.activeTab = tabId

      router.push(`/project/${ref}/sql/${snippet.id}`)
    } catch (error: any) {
      toast.error(`Failed to create new query: ${error.message}`)
    }
  }

  return (
    <div className="bg-surface-100 h-full overflow-y-auto py-12">
      <div className="mx-auto max-w-2xl flex flex-col gap-10 px-10">
        {!tabsInterfaceAcknowledge && (
          <Alert_Shadcn_ className="mb-4 relative">
            <AlertTitle_Shadcn_>
              <Badge variant="brand" className="mr-2">
                NEW
              </Badge>
              Tabs Interface for Editors
            </AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>
              The Table and SQL Editors now feature tabs for improved navigation and organization!
              Check out our{' '}
              <span
                className={cn(InlineLinkClassName, 'cursor-pointer')}
                onClick={() => {
                  appSnap.setSelectedFeaturePreview(
                    editor === 'table'
                      ? LOCAL_STORAGE_KEYS.UI_TABLE_EDITOR_TABS
                      : LOCAL_STORAGE_KEYS.UI_SQL_EDITOR_TABS
                  )
                  appSnap.setShowFeaturePreviewModal(true)
                }}
              >
                feature previews
              </span>{' '}
              for more information.
            </AlertDescription_Shadcn_>
            <AlertDescription_Shadcn_ className="mt-4 flex items-center gap-x-2">
              <Button asChild type="default" icon={<ExternalLink />}>
                <a
                  target="_blank"
                  rel="noreferrer noopener"
                  href="https://github.com/orgs/supabase/discussions/35636"
                >
                  View announcement
                </a>
              </Button>
            </AlertDescription_Shadcn_>
            <ButtonTooltip
              type="text"
              icon={<X />}
              className="absolute top-2 right-2 px-1"
              onClick={() => setTabsInterfaceAcknowledge(true)}
              tooltip={{ content: { side: 'bottom', text: 'Dismiss' } }}
            />
          </Alert_Shadcn_>
        )}

        <div className="grid grid-cols-2 gap-4">
          {actions.map((item, i) => (
            <ActionCard key={`action-card-${i}`} {...item} />
          ))}
        </div>
        <RecentItems />
      </div>
      {editor === 'sql' && (
        <div className="flex flex-col gap-4 mx-auto py-10">
          <Tabs_Shadcn_ defaultValue="templates">
            <TabsList_Shadcn_ className="mx-auto justify-center gap-5">
              <TabsTrigger_Shadcn_ value="templates">Templates</TabsTrigger_Shadcn_>
              <TabsTrigger_Shadcn_ value="quickstarts">Quickstarts</TabsTrigger_Shadcn_>
            </TabsList_Shadcn_>
            <TabsContent_Shadcn_ value="templates" className="max-w-5xl mx-auto py-5">
              <div className="grid grid-cols-3 gap-4 px-8">
                {templates.slice(0, 9).map((item, i) => (
                  <ActionCard
                    onClick={() => {
                      handleNewQuery(item.sql, item.title)
                      sendEvent({
                        action: 'sql_editor_template_clicked',
                        properties: { templateName: item.title },
                        groups: { project: ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
                      })
                    }}
                    bgColor="bg-alternative border"
                    key={`action-card-${i}`}
                    {...item}
                    icon={
                      <SQL_ICON className={cn('fill-foreground', 'w-4 h-4')} strokeWidth={1.5} />
                    }
                  />
                ))}
              </div>
              <div className="flex justify-center mt-5">
                <Button asChild type="default">
                  <Link href={`/project/${ref}/sql/templates`}>View more templates</Link>
                </Button>
              </div>
            </TabsContent_Shadcn_>
            <TabsContent_Shadcn_ value="quickstarts" className="max-w-5xl mx-auto py-5">
              <div className="grid grid-cols-3 gap-4 px-8">
                {quickstarts.map((item, i) => (
                  <ActionCard
                    onClick={() => {
                      handleNewQuery(item.sql, item.title)
                      sendEvent({
                        action: 'sql_editor_quickstart_clicked',
                        properties: { quickstartName: item.title },
                        groups: { project: ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
                      })
                    }}
                    bgColor="bg-alternative border"
                    key={`action-card-${i}`}
                    {...item}
                    icon={
                      <SQL_ICON className={cn('fill-foreground', 'w-4 h-4')} strokeWidth={1.5} />
                    }
                  />
                ))}
              </div>
              <div className="flex justify-center mt-5">
                <Button asChild type="default">
                  <Link href={`/project/${ref}/sql/quickstarts`}>View more templates</Link>
                </Button>
              </div>
            </TabsContent_Shadcn_>
          </Tabs_Shadcn_>
        </div>
      )}
    </div>
  )
}
