import { DatabaseZap, Plus, Search } from 'lucide-react'
import { parseAsJson, parseAsString, useQueryState } from 'nuqs'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { EMPTY_ARR } from '@/lib/void'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { DeleteEventTrigger } from 'components/interfaces/Database/Triggers/DeleteEventTrigger'
import {
  ReportsSelectFilter,
  selectFilterSchema,
} from 'components/interfaces/Reports/v2/ReportsSelectFilter'
import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { DocsButton } from 'components/ui/DocsButton'
import { useDatabaseEventTriggerDeleteMutation } from 'data/database-event-triggers/database-event-trigger-delete-mutation'
import {
  type DatabaseEventTrigger,
  useDatabaseEventTriggersQuery,
} from 'data/database-event-triggers/database-event-triggers-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL } from 'lib/constants'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { useEditorPanelStateSnapshot } from 'state/editor-panel-state'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import { Card, Input, Table, TableBody, TableHead, TableHeader, TableRow } from 'ui'
import { EmptyStatePresentational } from 'ui-patterns'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { EventTriggerList } from './EventTriggerList'
import { generateEventTriggerCreateSQL } from './EventTriggerList.utils'
import { DEFAULT_EVENT_TRIGGER_SQL, EVENT_TRIGGER_TEMPLATES } from './EventTriggers.constants'

const DEFAULT_OWNER_FILTER = ['postgres']

export const EventTriggersList = () => {
  const { data: project } = useSelectedProjectQuery()
  const [filterString, setFilterString] = useQueryState(
    'search',
    parseAsString.withDefault('').withOptions({ history: 'replace', clearOnDefault: true })
  )
  const [ownerFilter, setOwnerFilter] = useQueryState(
    'owner',
    parseAsJson(selectFilterSchema.parse)
  )
  const ownerFilterValue = ownerFilter ?? DEFAULT_OWNER_FILTER
  const [triggerToDelete, setTriggerToDelete] = useState<DatabaseEventTrigger | null>(null)
  const { openSidebar } = useSidebarManagerSnapshot()
  const aiSnap = useAiAssistantStateSnapshot()
  const {
    setValue: setEditorPanelValue,
    setTemplates: setEditorPanelTemplates,
    setInitialPrompt: setEditorPanelInitialPrompt,
  } = useEditorPanelStateSnapshot()

  const { can: canUpdateEventTriggers } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'triggers'
  )

  const {
    data: eventTriggers = EMPTY_ARR,
    error,
    isPending,
    isError,
  } = useDatabaseEventTriggersQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const { mutate: deleteEventTrigger, isPending: isDeletingEventTrigger } =
    useDatabaseEventTriggerDeleteMutation({
      onSuccess: (_, variables) => {
        toast.success(`Successfully removed ${variables.trigger.name}`)
        setTriggerToDelete(null)
      },
      onError: () => {
        setTriggerToDelete(null)
      },
    })

  const createEventTrigger = () => {
    setEditorPanelInitialPrompt('Create a new event trigger that...')
    setEditorPanelValue(DEFAULT_EVENT_TRIGGER_SQL)
    setEditorPanelTemplates(EVENT_TRIGGER_TEMPLATES)
    openSidebar(SIDEBAR_KEYS.EDITOR_PANEL)
  }

  const editEventTrigger = (trigger: DatabaseEventTrigger) => {
    setEditorPanelInitialPrompt(`Update the event trigger "${trigger.name}" that...`)
    const sql = generateEventTriggerCreateSQL(trigger)
    setEditorPanelValue(sql.length > 0 ? sql : DEFAULT_EVENT_TRIGGER_SQL)
    setEditorPanelTemplates([])
    openSidebar(SIDEBAR_KEYS.EDITOR_PANEL)
  }

  const editEventTriggerWithAssistant = (trigger: DatabaseEventTrigger) => {
    const sql = generateEventTriggerCreateSQL(trigger)
    openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
    aiSnap.newChat({
      name: `Update event trigger ${trigger.name}`,
      initialInput: `Update this event trigger to...`,
      suggestions: {
        title:
          'I can help you update this event trigger, here are a few example prompts to get you started:',
        prompts: [
          {
            label: 'Change firing event',
            description: 'Update this trigger to run on a different event',
          },
          {
            label: 'Update tags',
            description: 'Modify the tags used to filter which commands it fires for',
          },
          {
            label: 'Rename trigger',
            description: 'Rename this event trigger',
          },
        ],
      },
      sqlSnippets: [sql.length > 0 ? sql : DEFAULT_EVENT_TRIGGER_SQL],
    })
  }

  const duplicateEventTrigger = (trigger: DatabaseEventTrigger) => {
    const duplicateTrigger = { ...trigger, name: `${trigger.name}_duplicate` }
    setEditorPanelInitialPrompt('Create a new event trigger that...')
    const sql = generateEventTriggerCreateSQL(duplicateTrigger)
    setEditorPanelValue(sql.length > 0 ? sql : DEFAULT_EVENT_TRIGGER_SQL)
    setEditorPanelTemplates([])
    openSidebar(SIDEBAR_KEYS.EDITOR_PANEL)
  }

  const handleDeleteEventTrigger = (trigger: DatabaseEventTrigger) => {
    setTriggerToDelete(trigger)
  }

  const ownerOptions = useMemo(() => {
    const uniqueOwners = Array.from(
      new Set(eventTriggers.map((trigger) => trigger.owner).filter(Boolean) as string[])
    ).sort((a, b) => a.localeCompare(b))

    return uniqueOwners.includes('postgres') ? uniqueOwners : ['postgres', ...uniqueOwners]
  }, [eventTriggers])

  const showEmptyState = useMemo(() => {
    const hasPostgresOwnerTriggers = eventTriggers.some((trigger) => trigger.owner === 'postgres')
    return (
      ownerFilterValue.includes('postgres') &&
      ownerFilterValue.length === 1 &&
      !hasPostgresOwnerTriggers
    )
  }, [eventTriggers, ownerFilterValue])

  if (isPending) {
    return <GenericSkeletonLoader />
  }

  if (isError) {
    return <AlertError error={error} subject="Failed to retrieve event triggers" />
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 flex-wrap">
        <div className="flex flex-col lg:flex-row lg:items-center gap-2 flex-wrap">
          <Input
            placeholder="Search for an event trigger"
            size="tiny"
            icon={<Search />}
            value={filterString}
            className="w-full lg:w-64"
            onChange={(e) => setFilterString(e.target.value)}
          />
          <ReportsSelectFilter
            label="Owner"
            options={ownerOptions.map((owner) => ({
              label: owner,
              value: owner,
            }))}
            value={ownerFilterValue}
            onChange={setOwnerFilter}
            showSearch
          />
        </div>
        <div className="flex items-center gap-2">
          <DocsButton href={`${DOCS_URL}/guides/database/postgres/event-triggers`} />
          <ButtonTooltip
            type="primary"
            icon={<Plus size={12} />}
            disabled={!canUpdateEventTriggers}
            onClick={createEventTrigger}
            tooltip={{
              content: {
                side: 'bottom',
                text: !canUpdateEventTriggers
                  ? 'You need additional permissions to add a new event trigger'
                  : undefined,
              },
            }}
          >
            New trigger
          </ButtonTooltip>
        </div>
      </div>

      {showEmptyState ? (
        <EmptyStatePresentational
          icon={DatabaseZap}
          title="No event triggers yet"
          description="Event triggers run on database-level events like DDL commands."
        >
          <ButtonTooltip
            type="default"
            disabled={!canUpdateEventTriggers}
            onClick={createEventTrigger}
            tooltip={{
              content: {
                side: 'bottom',
                text: !canUpdateEventTriggers
                  ? 'You need additional permissions to add a new event trigger'
                  : undefined,
              },
            }}
          >
            New trigger
          </ButtonTooltip>
        </EmptyStatePresentational>
      ) : (
        <div className="w-full overflow-hidden overflow-x-auto">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead key="name">Name</TableHead>
                  <TableHead key="event">Event</TableHead>
                  <TableHead key="function">Function</TableHead>
                  <TableHead key="tags">Tags</TableHead>
                  <TableHead key="enabled" className="w-20">
                    Enabled
                  </TableHead>
                  <TableHead key="buttons" className="w-1/12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <EventTriggerList
                  eventTriggers={eventTriggers}
                  filterString={filterString}
                  ownerFilter={ownerFilterValue}
                  canEdit={canUpdateEventTriggers}
                  onEditTrigger={editEventTrigger}
                  onEditTriggerWithAssistant={editEventTriggerWithAssistant}
                  onDuplicateTrigger={duplicateEventTrigger}
                  onDeleteTrigger={handleDeleteEventTrigger}
                />
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      <DeleteEventTrigger
        trigger={triggerToDelete ?? undefined}
        visible={!!triggerToDelete}
        onCancel={() => setTriggerToDelete(null)}
        onDelete={() => {
          if (!project) {
            toast.error('Project is required to delete an event trigger')
            return
          }
          if (!triggerToDelete) return

          deleteEventTrigger({
            projectRef: project.ref,
            connectionString: project.connectionString,
            trigger: triggerToDelete,
          })
        }}
        isLoading={isDeletingEventTrigger}
      />
    </div>
  )
}
