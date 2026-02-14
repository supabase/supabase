import type { PostgresTrigger } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useIsInlineEditorEnabled } from 'components/interfaces/Account/Preferences/InlineEditorSettings'
import { ProtectedSchemaWarning } from 'components/interfaces/Database/ProtectedSchemaWarning'
import { DeleteTrigger } from 'components/interfaces/Database/Triggers/DeleteTrigger'
import { TriggerSheet } from 'components/interfaces/Database/Triggers/TriggerSheet'
import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import AlertError from 'components/ui/AlertError'
import { DocsButton } from 'components/ui/DocsButton'
import SchemaSelector from 'components/ui/SchemaSelector'
import { useDatabaseTriggerDeleteMutation } from 'data/database-triggers/database-trigger-delete-mutation'
import { useDatabaseTriggersQuery } from 'data/database-triggers/database-triggers-query'
import { useTablesQuery } from 'data/tables/tables-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { handleErrorOnDelete, useQueryStateWithSelect } from 'hooks/misc/useQueryStateWithSelect'
import { useQuerySchemaState } from 'hooks/misc/useSchemaQueryState'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useIsProtectedSchema, useProtectedSchemas } from 'hooks/useProtectedSchemas'
import { DOCS_URL } from 'lib/constants'
import { DatabaseZap, Search } from 'lucide-react'
import { parseAsBoolean, parseAsJson, parseAsString, useQueryState } from 'nuqs'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { useEditorPanelStateSnapshot } from 'state/editor-panel-state'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import { Card, Input, Table, TableBody, TableHead, TableHeader, TableRow } from 'ui'
import { EmptyStatePresentational } from 'ui-patterns'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { CreateTriggerButtons } from './CreateTriggerButtons'
import { TriggerList } from './TriggerList'
import { generateTriggerCreateSQL } from './TriggerList.utils'
import {
  ReportsSelectFilter,
  selectFilterSchema,
} from '@/components/interfaces/Reports/v2/ReportsSelectFilter'

export const TriggersList = () => {
  const [selectedTrigger, setSelectedTrigger] = useState<PostgresTrigger>()
  const deletingTriggerIdRef = useRef<string | null>(null)
  const { data: project } = useSelectedProjectQuery()
  const { openSidebar } = useSidebarManagerSnapshot()
  const { selectedSchema, setSelectedSchema } = useQuerySchemaState()

  const [filterString, setFilterString] = useQueryState('search', parseAsString.withDefault(''))
  const [tablesFilter, setTablesFilter] = useQueryState(
    'tables',
    parseAsJson(selectFilterSchema.parse).withDefault([])
  )

  const isInlineEditorEnabled = useIsInlineEditorEnabled()
  const {
    templates: editorPanelTemplates,
    setValue: setEditorPanelValue,
    setTemplates: setEditorPanelTemplates,
    setInitialPrompt: setEditorPanelInitialPrompt,
  } = useEditorPanelStateSnapshot()

  const { data: protectedSchemas } = useProtectedSchemas()
  const { isSchemaLocked } = useIsProtectedSchema({ schema: selectedSchema })

  const { data = [] } = useTablesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const hasTables =
    data.filter((a) => !protectedSchemas.find((s) => s.name === a.schema)).length > 0

  const {
    data: triggers,
    error,
    isPending,
    isError,
  } = useDatabaseTriggersQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const { can: canCreateTriggers } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'triggers'
  )

  const [showCreateTriggerForm, setShowCreateTriggerForm] = useQueryState(
    'new',
    parseAsBoolean.withDefault(false).withOptions({ history: 'push', clearOnDefault: true })
  )
  const { setValue: setTriggerToEdit, value: triggerToEdit } = useQueryStateWithSelect({
    urlKey: 'edit',
    select: (id: string) => (id ? triggers?.find((fn) => fn.id.toString() === id) : undefined),
    enabled: !!triggers,
    onError: () => toast.error(`Trigger not found`),
  })

  const { setValue: setTriggerToDuplicate, value: triggerToDuplicate } = useQueryStateWithSelect({
    urlKey: 'duplicate',
    select: (id: string) => {
      if (!id) return undefined
      const original = triggers?.find((trigger) => trigger.id.toString() === id)
      return original ? { ...original, name: `${original.name}_duplicate` } : undefined
    },
    enabled: !!triggers,
    onError: () => toast.error(`Trigger not found`),
  })

  const { setValue: setTriggerToDelete, value: triggerToDelete } = useQueryStateWithSelect({
    urlKey: 'delete',
    select: (id: string) => (id ? triggers?.find((fn) => fn.id.toString() === id) : undefined),
    enabled: !!triggers,
    onError: (_error, selectedId) =>
      handleErrorOnDelete(deletingTriggerIdRef, selectedId, `Database Trigger not found`),
  })

  const { mutate: deleteDatabaseTrigger, isPending: isDeletingTrigger } =
    useDatabaseTriggerDeleteMutation({
      onSuccess: (_, variables) => {
        toast.success(`Successfully removed ${variables.trigger.name}`)
        setTriggerToDelete(null)
      },
      onError: () => {
        deletingTriggerIdRef.current = null
      },
    })

  const createTrigger = () => {
    setTriggerToDuplicate(null)
    if (isInlineEditorEnabled) {
      setEditorPanelInitialPrompt('Create a new database trigger that...')
      setEditorPanelValue(`create trigger trigger_name
after insert or update or delete on table_name
for each row
execute function function_name();`)
      if (editorPanelTemplates.length > 0) {
        setEditorPanelTemplates([])
      }
      openSidebar(SIDEBAR_KEYS.EDITOR_PANEL)
    } else {
      setSelectedTrigger(undefined)
      setShowCreateTriggerForm(true)
    }
  }

  const editTrigger = (trigger: PostgresTrigger) => {
    setTriggerToDuplicate(null)
    if (isInlineEditorEnabled) {
      setEditorPanelValue(generateTriggerCreateSQL(trigger))
      setEditorPanelTemplates([])
      openSidebar(SIDEBAR_KEYS.EDITOR_PANEL)
    } else {
      setTriggerToEdit(trigger.id.toString())
    }
  }

  const duplicateTrigger = (trigger: PostgresTrigger) => {
    if (isInlineEditorEnabled) {
      const dupTrigger = {
        ...trigger,
        name: `${trigger.name}_duplicate`,
      }
      setEditorPanelValue(generateTriggerCreateSQL(dupTrigger))
      setEditorPanelTemplates([])
      openSidebar(SIDEBAR_KEYS.EDITOR_PANEL)
    } else {
      setTriggerToDuplicate(trigger.id.toString())
    }
  }

  const deleteTrigger = (trigger: PostgresTrigger) => {
    setTriggerToDelete(trigger.id.toString())
  }

  if (isPending) {
    return <GenericSkeletonLoader />
  }

  if (isError) {
    return <AlertError error={error} subject="Failed to retrieve database triggers" />
  }

  const schemaTriggers = triggers.filter((x) => x.schema === selectedSchema)
  const tables = Array.from(new Set(schemaTriggers.map((x) => x.table))).sort()

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 flex-wrap">
          <div className="flex flex-col lg:flex-row lg:items-center gap-2 flex-wrap">
            <SchemaSelector
              className="w-full lg:w-[180px]"
              size="tiny"
              showError={false}
              selectedSchemaName={selectedSchema}
              onSelectSchema={setSelectedSchema}
            />
            <Input
              placeholder="Search for a trigger"
              size="tiny"
              icon={<Search />}
              value={filterString}
              className="w-full lg:w-52"
              onChange={(e) => setFilterString(e.target.value)}
            />
            <ReportsSelectFilter
              label="Table"
              options={tables.map((type) => ({ label: type, value: type }))}
              value={tablesFilter ?? []}
              onChange={setTablesFilter}
              showSearch
            />
          </div>
          <div className="flex items-center gap-2">
            <DocsButton href={`${DOCS_URL}/guides/database/postgres/triggers`} />
            {!isSchemaLocked && (
              <CreateTriggerButtons
                hasTables={hasTables}
                canCreateTriggers={canCreateTriggers}
                selectedSchema={selectedSchema}
                onCreateTrigger={createTrigger}
                showPlusIcon={true}
              />
            )}
          </div>
        </div>

        {isSchemaLocked && <ProtectedSchemaWarning schema={selectedSchema} entity="triggers" />}

        {!isSchemaLocked && (schemaTriggers ?? []).length === 0 ? (
          <EmptyStatePresentational
            icon={DatabaseZap}
            title="Add your first trigger"
            description="Make your database reactive. Send updates in realtime, call edge functions, or validate data as it comes in."
          >
            <CreateTriggerButtons
              hasTables={hasTables}
              canCreateTriggers={canCreateTriggers}
              selectedSchema={selectedSchema}
              onCreateTrigger={createTrigger}
              showPlusIcon={false}
              buttonType="default"
            />
          </EmptyStatePresentational>
        ) : (
          <div className="w-full overflow-hidden overflow-x-auto">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead key="name">Name</TableHead>
                    <TableHead key="table">Table</TableHead>
                    <TableHead key="function">Function</TableHead>
                    <TableHead key="events">Events</TableHead>
                    <TableHead key="orientation">Orientation</TableHead>
                    <TableHead key="enabled" className="w-20">
                      Enabled
                    </TableHead>
                    <TableHead key="buttons" className="w-1/12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TriggerList
                    editTrigger={editTrigger}
                    duplicateTrigger={duplicateTrigger}
                    deleteTrigger={deleteTrigger}
                  />
                </TableBody>
              </Table>
            </Card>
          </div>
        )}
      </div>

      <TriggerSheet
        selectedTrigger={selectedTrigger}
        open={showCreateTriggerForm}
        onClose={() => {
          setShowCreateTriggerForm(false)
        }}
        isDuplicatingTrigger={false}
      />

      <TriggerSheet
        selectedTrigger={triggerToEdit || triggerToDuplicate}
        open={!!triggerToEdit || !!triggerToDuplicate}
        onClose={() => {
          setTriggerToEdit(null)
          setTriggerToDuplicate(null)
        }}
        isDuplicatingTrigger={!!triggerToDuplicate}
      />

      <DeleteTrigger
        trigger={triggerToDelete}
        visible={!!triggerToDelete}
        setVisible={setTriggerToDelete}
        onDelete={(params: Parameters<typeof deleteDatabaseTrigger>[0]) => {
          deletingTriggerIdRef.current = params.trigger.id.toString()
          deleteDatabaseTrigger(params)
        }}
        isLoading={isDeletingTrigger}
      />
    </>
  )
}
