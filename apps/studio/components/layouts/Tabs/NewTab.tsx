import { PermissionAction } from '@supabase/shared-types/out/constants'
import dayjs from 'dayjs'
import { partition } from 'lodash'
import { Table2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { SQL_TEMPLATES } from 'components/interfaces/SQLEditor/SQLEditor.queries'
import { createSqlSnippetSkeletonV2 } from 'components/interfaces/SQLEditor/SQLEditor.utils'
import { QuickstartAIWidget } from 'components/interfaces/TableGridEditor/SidePanelEditor/TableEditor/TableQuickstart/QuickstartAIWidget'
import { QuickstartTemplatesWidget } from 'components/interfaces/TableGridEditor/SidePanelEditor/TableEditor/TableQuickstart/QuickstartTemplatesWidget'
import { QuickstartVariant } from 'components/interfaces/TableGridEditor/SidePanelEditor/TableEditor/TableQuickstart/types'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useQuerySchemaState } from 'hooks/misc/useSchemaQueryState'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { usePHFlag } from 'hooks/ui/useFlag'
import { useIsProtectedSchema } from 'hooks/useProtectedSchemas'
import { uuidv4 } from 'lib/helpers'
import { useProfile } from 'lib/profile'
import { useTrack } from 'lib/telemetry/track'
import { AssistantMessageType, useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { createTabId, useTabsStateSnapshot } from 'state/tabs'
import {
  AiIconAnimation,
  Button,
  SQL_ICON,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
  Tabs_Shadcn_,
  cn,
} from 'ui'
import { useEditorType } from '../editors/EditorsLayout.hooks'
import { SIDEBAR_KEYS } from '../ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { ActionCard } from './ActionCard'
import { RecentItems } from './RecentItems'

const NEW_PROJECT_THRESHOLD_DAYS = 7
const TABLE_QUICKSTART_FLAG = 'tableQuickstart'

const ASSISTANT_QUICKSTART_MESSAGES = {
  user: 'Help me create a new database table for my project',
  assistant:
    "I'll help you create a database table. Please tell me:\n\n1. What does your application do?\n2. What kind of data do you want to store?\n\nI'll suggest a table structure that fits your requirements and help you create it directly in your database.",
}

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
  const aiSnap = useAiAssistantStateSnapshot()
  const { openSidebar } = useSidebarManagerSnapshot()
  const [isCreatingChat, setIsCreatingChat] = useState(false)
  const [templates] = partition(SQL_TEMPLATES, { type: 'template' })
  const [quickstarts] = partition(SQL_TEMPLATES, { type: 'quickstart' })
  const hasTrackedExposure = useRef(false)

  const { mutate: sendEvent } = useSendEventMutation()
  const track = useTrack()
  const { can: canCreateSQLSnippet } = useAsyncCheckPermissions(
    PermissionAction.CREATE,
    'user_content',
    {
      resource: { type: 'sql', owner_id: profile?.id },
      subject: { id: profile?.id },
    }
  )

  /**
   * Returns:
   * - `QuickstartVariant`: user variation (`control`, `ai`, `templates`, `assistant`)
   * - `false`: user not yet bucketed or not targeted for experiment
   * - `undefined`: PostHog still loading
   */
  const tableQuickstartVariant = usePHFlag<QuickstartVariant | false | undefined>(
    TABLE_QUICKSTART_FLAG
  )

  const isNewProject = useMemo(() => {
    if (!project?.inserted_at) return false
    return dayjs().diff(dayjs(project.inserted_at), 'day') < NEW_PROJECT_THRESHOLD_DAYS
  }, [project?.inserted_at])

  const activeQuickstartVariant =
    editor !== 'sql' &&
    isNewProject &&
    tableQuickstartVariant &&
    tableQuickstartVariant !== QuickstartVariant.CONTROL
      ? tableQuickstartVariant
      : null

  const shouldTrackExposure =
    editor !== 'sql' &&
    isNewProject &&
    tableQuickstartVariant !== false &&
    tableQuickstartVariant !== undefined

  useEffect(() => {
    if (shouldTrackExposure && !hasTrackedExposure.current) {
      hasTrackedExposure.current = true
      track('table_quickstart_opened', {
        variant: tableQuickstartVariant,
      })
    }
  }, [shouldTrackExposure, tableQuickstartVariant, track])

  const handleOpenAssistant = () => {
    if (isCreatingChat) return

    setIsCreatingChat(true)

    try {
      openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
      const chatId = aiSnap.newChat({
        name: 'Create a database table',
      })

      if (!chatId) {
        track('table_quickstart_assistant_opened', {
          chatCreated: false,
        })
        throw new Error('Failed to create chat')
      }

      const userMessage: AssistantMessageType = {
        id: uuidv4(),
        role: 'user',
        parts: [{ type: 'text', text: ASSISTANT_QUICKSTART_MESSAGES.user }],
      }

      const assistantMessage: AssistantMessageType = {
        id: uuidv4(),
        role: 'assistant',
        parts: [{ type: 'text', text: ASSISTANT_QUICKSTART_MESSAGES.assistant }],
      }

      aiSnap.saveMessage([userMessage, assistantMessage])

      track('table_quickstart_assistant_opened', {
        chatCreated: true,
      })
    } catch (error) {
      console.error('Failed to open AI assistant:', error)
      const message = error instanceof Error ? error.message : 'Unknown error'
      toast.error(`Unable to open AI assistant: ${message}`)
    } finally {
      setIsCreatingChat(false)
    }
  }

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
          {activeQuickstartVariant === QuickstartVariant.ASSISTANT && (
            <ActionCard
              icon={<AiIconAnimation size={16} loading={isCreatingChat} />}
              title="Create with Assistant"
              description="Use AI to design your database table"
              bgColor="bg-brand-200"
              onClick={handleOpenAssistant}
            />
          )}
        </div>
        {activeQuickstartVariant === QuickstartVariant.AI && (
          <QuickstartAIWidget onSelectTable={(tableData) => snap.onAddTable(tableData)} />
        )}
        {activeQuickstartVariant === QuickstartVariant.TEMPLATES && (
          <QuickstartTemplatesWidget onSelectTemplate={(tableData) => snap.onAddTable(tableData)} />
        )}
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
