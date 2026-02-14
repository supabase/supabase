import { PermissionAction } from '@supabase/shared-types/out/constants'
import { partition } from 'lodash'
import { Table2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { toast } from 'sonner'

import { useParams } from 'common'
import { SQL_TEMPLATES } from 'components/interfaces/SQLEditor/SQLEditor.queries'
import { createSqlSnippetSkeletonV2 } from 'components/interfaces/SQLEditor/SQLEditor.utils'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useQuerySchemaState } from 'hooks/misc/useSchemaQueryState'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useIsProtectedSchema } from 'hooks/useProtectedSchemas'
import { useProfile } from 'lib/profile'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { createTabId, useTabsStateSnapshot } from 'state/tabs'
import {
  Button,
  SQL_ICON,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
  Tabs_Shadcn_,
  cn,
} from 'ui'
import { useEditorType } from '../editors/EditorsLayout.hooks'
import { ActionCard } from './ActionCard'
import { RecentItems } from './RecentItems'

export function NewTab() {
  const router = useRouter()
  const { ref } = useParams()
  const editor = useEditorType()
  const { profile } = useProfile()
  const { data: org } = useSelectedOrganizationQuery()
  const { data: project } = useSelectedProjectQuery()
  const { selectedSchema } = useQuerySchemaState()
  const { isSchemaLocked } = useIsProtectedSchema({ schema: selectedSchema })

  const snap = useTableEditorStateSnapshot()
  const snapV2 = useSqlEditorV2StateSnapshot()
  const tabs = useTabsStateSnapshot()
  const [templates] = partition(SQL_TEMPLATES, { type: 'template' })
  const [quickstarts] = partition(SQL_TEMPLATES, { type: 'quickstart' })

  const { mutate: sendEvent } = useSendEventMutation()
  const { can: canCreateSQLSnippet } = useAsyncCheckPermissions(
    PermissionAction.CREATE,
    'user_content',
    {
      resource: { type: 'sql', owner_id: profile?.id },
      subject: { id: profile?.id },
    }
  )

  const tableEditorActions = isSchemaLocked
    ? []
    : [
        {
          icon: <Table2 className="h-4 w-4 text-foreground" strokeWidth={1.5} />,
          title: 'Create a table',
          description: 'Design and create a new database table',
          bgColor: 'bg-blue-500',
          isBeta: false,
          onClick: () => snap.onAddTable(),
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
        name,
        sql,
        owner_id: profile?.id,
        project_id: project?.id,
      })
      snapV2.addSnippet({ projectRef: ref, snippet })
      snapV2.addNeedsSaving(snippet.id)

      const tabId = createTabId('sql', { id: snippet.id })

      tabs.addTab({
        id: tabId,
        type: 'sql',
        label: name,
        metadata: { sqlId: snippet.id },
      })

      router.push(`/project/${ref}/sql/${snippet.id}`)
    } catch (error: any) {
      toast.error(`Failed to create new query: ${error.message}`)
    }
  }

  return (
    <div className="bg-surface-100 h-full overflow-y-auto py-12">
      <div className="mx-auto max-w-2xl flex flex-col gap-10 px-10">
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
