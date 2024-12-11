import { useParams } from 'common'
import { SQL_TEMPLATES } from 'components/interfaces/SQLEditor/SQLEditor.queries'
import { partition } from 'lodash'
import { BarChart2, Table2, Upload } from 'lucide-react'
import { useRouter } from 'next/router'
import {
  cn,
  SQL_ICON,
  Tabs_Shadcn_,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
} from 'ui'
import { useEditorType } from '../editors/editors-layout.hooks'
import { ActionCard } from './actions-card'

import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { RecentItems } from './recent-items'

export function NewTab() {
  const router = useRouter()
  const { ref } = useParams()
  const editor = useEditorType()

  const handleNewQuery = async (sql?: string, name?: string) => {
    router.push(`/project/${ref}/sql/new`)
  }

  const [templates] = partition(SQL_TEMPLATES, { type: 'template' })
  const [quickstarts] = partition(SQL_TEMPLATES, { type: 'quickstart' })

  const { mutate: sendEvent } = useSendEventMutation()

  const tableEditorActions = [
    {
      icon: <Table2 className="h-4 w-4 text-foreground" strokeWidth={1.5} />,
      title: 'Create a table',
      description: 'Design and create a new database table',
      bgColor: 'bg-blue-500',
      isBeta: false,
      onClick: handleNewQuery,
    },
  ]

  const sqlEditorActions = [
    {
      icon: <SQL_ICON className={cn('fill-foreground', 'w-4 h-4')} strokeWidth={1.5} />,
      title: 'New SQL Snippet',
      description: 'Execute SQL queries',
      bgColor: 'bg-green-500',
      isBeta: false,
      onClick: handleNewQuery,
    },
  ]

  const actions = editor === 'sql' ? sqlEditorActions : tableEditorActions

  return (
    <div className="bg-surface-100 h-full overflow-y-auto py-12">
      <div className="mx-auto max-w-2xl flex flex-col gap-10">
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
                {templates.map((item, i) => (
                  <ActionCard
                    onClick={() => {
                      handleNewQuery(item.sql, item.title)
                      sendEvent({
                        category: 'scripts',
                        action: 'script_clicked',
                        label: item.title,
                      })
                    }}
                    bgColor="bg-alternative"
                    key={`action-card-${i}`}
                    {...item}
                    icon={
                      <SQL_ICON className={cn('fill-foreground', 'w-4 h-4')} strokeWidth={1.5} />
                    }
                  />
                ))}
              </div>
            </TabsContent_Shadcn_>
            <TabsContent_Shadcn_ value="quickstarts" className="max-w-5xl mx-auto py-5">
              <div className="grid grid-cols-3 gap-4 px-8">
                {quickstarts.map((item, i) => (
                  <ActionCard
                    onClick={() => {
                      handleNewQuery(item.sql, item.title)
                      sendEvent({
                        category: 'scripts',
                        action: 'script_clicked',
                        label: item.title,
                      })
                    }}
                    bgColor="bg-alternative"
                    key={`action-card-${i}`}
                    {...item}
                    icon={
                      <SQL_ICON className={cn('fill-foreground', 'w-4 h-4')} strokeWidth={1.5} />
                    }
                  />
                ))}
              </div>
            </TabsContent_Shadcn_>
          </Tabs_Shadcn_>
        </div>
      )}
    </div>
  )
}
