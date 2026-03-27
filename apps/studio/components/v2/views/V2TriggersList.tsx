'use client'

import type { PostgresTrigger } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useIsInlineEditorEnabled } from 'components/interfaces/Account/Preferences/InlineEditorSettings'
import { ProtectedSchemaWarning } from 'components/interfaces/Database/ProtectedSchemaWarning'
import { CreateTriggerButtons } from 'components/interfaces/Database/Triggers/TriggersList/CreateTriggerButtons'
import { TriggerSheet } from 'components/interfaces/Database/Triggers/TriggerSheet'
import { generateTriggerCreateSQL } from 'components/interfaces/Database/Triggers/TriggersList/TriggerList.utils'
import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import SchemaSelector from 'components/ui/SchemaSelector'
import { TextConfirmModal } from 'components/ui/TextConfirmModalWrapper'
import { DocsButton } from 'components/ui/DocsButton'
import { useDatabaseTriggerDeleteMutation } from 'data/database-triggers/database-trigger-delete-mutation'
import { useDatabaseTriggersQuery } from 'data/database-triggers/database-triggers-query'
import { isValidConnString } from 'data/fetchers'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'
import { useTablesQuery } from 'data/tables/tables-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useQuerySchemaState } from 'hooks/misc/useSchemaQueryState'
import { useIsProtectedSchema, useProtectedSchemas } from 'hooks/useProtectedSchemas'
import { DOCS_URL } from 'lib/constants'
import { Check, CopyPlus, Pencil, Sparkles, Trash2, X } from 'lucide-react'
import Link from 'next/link'
import { parseAsString, useQueryState } from 'nuqs'
import { useCallback, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { useEditorPanelStateSnapshot } from 'state/editor-panel-state'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import { Badge } from 'ui'

import { useV2Params } from '@/app/v2/V2ParamsContext'
import { DataTableRenderer } from '@/components/v2/DataTableRenderer'
import type {
  DataTableColumn,
  FilterDefinition,
  RowAction,
} from '@/components/v2/DataTableRenderer'
import { useEntityPanelParams } from '@/components/v2/hooks/useEntityPanelParams'

export function V2TriggersList() {
  const { projectRef } = useV2Params()
  const base = projectRef ? `/v2/project/${projectRef}` : ''

  const { selectedSchema, setSelectedSchema } = useQuerySchemaState()
  const { isSchemaLocked } = useIsProtectedSchema({ schema: selectedSchema })
  const { data: protectedSchemas } = useProtectedSchemas()

  const { openSidebar } = useSidebarManagerSnapshot()
  const aiSnap = useAiAssistantStateSnapshot()
  const isInlineEditorEnabled = useIsInlineEditorEnabled()
  const {
    templates: editorPanelTemplates,
    setValue: setEditorPanelValue,
    setTemplates: setEditorPanelTemplates,
    setInitialPrompt: setEditorPanelInitialPrompt,
  } = useEditorPanelStateSnapshot()

  const {
    isCreating,
    setIsCreating,
    editingId,
    setEditingId,
    duplicatingId,
    setDuplicatingId,
    closePanels,
  } = useEntityPanelParams()

  const [deleteId, setDeleteId] = useQueryState(
    'delete',
    parseAsString.withOptions({ history: 'push', clearOnDefault: true })
  )

  const { data: project, isPending: isProjectPending } = useProjectDetailQuery(
    { ref: projectRef },
    { enabled: Boolean(projectRef) }
  )

  const shouldFetch = Boolean(projectRef) && isValidConnString(project?.connectionString)

  const { data: tables = [] } = useTablesQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    },
    { enabled: shouldFetch }
  )
  const hasTables =
    tables.filter((t) => !protectedSchemas?.find((s) => s.name === t.schema)).length > 0

  const {
    data: triggers = [],
    error,
    isPending: isTriggersPending,
    isSuccess,
    isError,
  } = useDatabaseTriggersQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    },
    { enabled: shouldFetch }
  )

  const { can: canWriteTriggers } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'triggers'
  )

  const schemaTriggers = useMemo(
    () => triggers.filter((t) => t.schema === selectedSchema),
    [triggers, selectedSchema]
  )

  const tableFilterOptions = useMemo(() => {
    const names = Array.from(new Set(schemaTriggers.map((t) => t.table))).sort()
    return names.map((name) => ({ value: name, label: name }))
  }, [schemaTriggers])

  const filters: FilterDefinition[] = useMemo(() => {
    const list: FilterDefinition[] = [
      {
        id: 'search',
        label: 'Search',
        type: 'search',
        placeholder: 'Search triggers…',
      },
    ]
    if (tableFilterOptions.length > 0) {
      list.push({
        id: 'table',
        label: 'Table',
        type: 'multi-select',
        options: tableFilterOptions,
      })
    }
    return list
  }, [tableFilterOptions])

  const triggerToEdit = triggers.find((t) => t.id.toString() === editingId)
  const triggerToDuplicate = triggers.find((t) => t.id.toString() === duplicatingId)
  const triggerToDelete = triggers.find((t) => t.id.toString() === deleteId)

  const {
    mutate: deleteDatabaseTrigger,
    isPending: isDeletingTrigger,
    isSuccess: isSuccessDelete,
  } = useDatabaseTriggerDeleteMutation({
    onSuccess: (_, variables) => {
      toast.success(`Successfully removed ${variables.trigger.name}`)
      void setDeleteId(null)
    },
  })

  const columns: DataTableColumn<PostgresTrigger>[] = useMemo(
    () => [
      {
        id: 'name',
        name: 'Name',
        width: 200,
        minWidth: 120,
        sortable: true,
        renderCell: (_v, row) => (
          <span className="font-mono text-xs text-foreground truncate" title={row.name}>
            {row.name}
          </span>
        ),
      },
      {
        id: 'table',
        name: 'Table',
        width: 160,
        sortable: true,
        renderCell: (_v, row) =>
          row.table_id ? (
            <Link
              href={`${base}/data/tables/${row.table_id}`}
              className="text-link-table-cell font-mono text-xs text-foreground-light truncate block max-w-full"
            >
              {row.table}
            </Link>
          ) : (
            <span className="font-mono text-xs truncate" title={row.table}>
              {row.table}
            </span>
          ),
      },
      {
        id: 'function_name',
        name: 'Function',
        width: 180,
        renderCell: (_v, row) =>
          row.function_name ? (
            <Link
              href={`${base}/data/functions?search=${encodeURIComponent(row.function_name)}`}
              className="text-link-table-cell font-mono text-xs text-foreground-light truncate block max-w-full"
            >
              {row.function_name}
            </Link>
          ) : (
            <span className="text-foreground-lighter">—</span>
          ),
      },
      {
        id: 'events',
        name: 'Events',
        width: 220,
        renderCell: (_v, row) => (
          <div className="flex flex-wrap gap-1">
            {row.events.map((event: string) => (
              <Badge key={`${row.id}-${event}`} className="text-[10px]">
                {`${row.activation} ${event}`}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        id: 'orientation',
        name: 'Orientation',
        width: 120,
        renderCell: (_v, row) => (
          <span className="text-xs truncate" title={row.orientation}>
            {row.orientation}
          </span>
        ),
      },
      {
        id: 'enabled_mode',
        name: 'Enabled',
        width: 88,
        align: 'center',
        renderCell: (_v, row) => (
          <div className="flex justify-center">
            {row.enabled_mode !== 'DISABLED' ? (
              <Check strokeWidth={2} className="text-brand size-4" />
            ) : (
              <X strokeWidth={2} className="text-foreground-lighter size-4" />
            )}
          </div>
        ),
      },
    ],
    [base]
  )

  const createTrigger = useCallback(() => {
    void setDuplicatingId(null)
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
      void setIsCreating(true)
    }
  }, [
    isInlineEditorEnabled,
    setDuplicatingId,
    setEditorPanelInitialPrompt,
    setEditorPanelValue,
    editorPanelTemplates.length,
    setEditorPanelTemplates,
    openSidebar,
    setIsCreating,
  ])

  const editTrigger = useCallback(
    (trigger: PostgresTrigger) => {
      void setDuplicatingId(null)
      if (isInlineEditorEnabled) {
        setEditorPanelValue(generateTriggerCreateSQL(trigger))
        setEditorPanelTemplates([])
        openSidebar(SIDEBAR_KEYS.EDITOR_PANEL)
      } else {
        void setEditingId(trigger.id.toString())
      }
    },
    [
      isInlineEditorEnabled,
      setDuplicatingId,
      setEditorPanelValue,
      setEditorPanelTemplates,
      openSidebar,
      setEditingId,
    ]
  )

  const duplicateTrigger = useCallback(
    (trigger: PostgresTrigger) => {
      if (isInlineEditorEnabled) {
        const dup = { ...trigger, name: `${trigger.name}_duplicate` }
        setEditorPanelValue(generateTriggerCreateSQL(dup))
        setEditorPanelTemplates([])
        openSidebar(SIDEBAR_KEYS.EDITOR_PANEL)
      } else {
        void setDuplicatingId(trigger.id.toString())
      }
    },
    [isInlineEditorEnabled, setEditorPanelValue, setEditorPanelTemplates, openSidebar, setDuplicatingId]
  )

  const openAssistantForTrigger = useCallback(
    (trigger: PostgresTrigger) => {
      const sql = generateTriggerCreateSQL(trigger)
      openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
      aiSnap.newChat({
        name: `Update trigger ${trigger.name}`,
        initialInput: `Update this trigger which exists on the ${trigger.schema}.${trigger.table} table to...`,
        suggestions: {
          title:
            'I can help you make a change to this trigger, here are a few example prompts to get you started:',
          prompts: [
            { label: 'Rename Trigger', description: 'Rename this trigger to ...' },
            { label: 'Change Events', description: 'Change the events this trigger responds to ...' },
            {
              label: 'Modify Timing',
              description: 'Modify this trigger to run after instead of before ...',
            },
          ],
        },
        sqlSnippets: [sql],
      })
    },
    [aiSnap, openSidebar]
  )

  const rowActions = useMemo((): RowAction<PostgresTrigger>[] | undefined => {
    if (isSchemaLocked || !canWriteTriggers) return undefined
    return [
      {
        id: 'edit',
        label: 'Edit trigger',
        icon: <Pencil size={12} />,
        onClick: (row: PostgresTrigger): void => {
          editTrigger(row)
        },
      },
      {
        id: 'assistant',
        label: 'Edit with Assistant',
        icon: <Sparkles size={12} />,
        onClick: (row: PostgresTrigger): void => {
          openAssistantForTrigger(row)
        },
      },
      {
        id: 'duplicate',
        label: 'Duplicate trigger',
        icon: <CopyPlus size={12} />,
        onClick: (row: PostgresTrigger): void => {
          duplicateTrigger(row)
        },
      },
      {
        id: 'delete',
        label: 'Delete trigger',
        icon: <Trash2 size={12} />,
        variant: 'danger' as const,
        onClick: (row: PostgresTrigger): void => {
          void setDeleteId(row.id.toString())
        },
      },
    ]
  }, [
    isSchemaLocked,
    canWriteTriggers,
    editTrigger,
    duplicateTrigger,
    openAssistantForTrigger,
    setDeleteId,
  ])

  useEffect(() => {
    if (isSuccess && !!editingId && !triggerToEdit) {
      toast('Trigger not found')
      void setEditingId(null)
    }
  }, [isSuccess, editingId, triggerToEdit, setEditingId])

  useEffect(() => {
    if (isSuccess && !!duplicatingId && !triggerToDuplicate) {
      toast('Trigger not found')
      void setDuplicatingId(null)
    }
  }, [isSuccess, duplicatingId, triggerToDuplicate, setDuplicatingId])

  useEffect(() => {
    if (isSuccess && !!deleteId && !triggerToDelete && !isSuccessDelete) {
      toast('Trigger not found')
      void setDeleteId(null)
    }
  }, [isSuccess, deleteId, triggerToDelete, isSuccessDelete, setDeleteId])

  const onDeleteConfirm = () => {
    if (!projectRef || !project?.connectionString || !triggerToDelete) return
    deleteDatabaseTrigger({
      projectRef,
      connectionString: project.connectionString,
      trigger: triggerToDelete,
    })
  }

  const toolbarLeft = (
    <div className="flex flex-wrap items-center gap-2 min-w-0">
      <SchemaSelector
        className="w-[min(100%,180px)] shrink-0"
        size="tiny"
        showError={false}
        selectedSchemaName={selectedSchema}
        onSelectSchema={setSelectedSchema}
      />
    </div>
  )

  const toolbarRight = (
    <div className="flex items-center gap-2 shrink-0">
      <DocsButton href={`${DOCS_URL}/guides/database/postgres/triggers`} />
      {!isSchemaLocked && (
        <CreateTriggerButtons
          hasTables={hasTables}
          canCreateTriggers={canWriteTriggers}
          selectedSchema={selectedSchema}
          onCreateTrigger={createTrigger}
          showPlusIcon
        />
      )}
    </div>
  )

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-3">
      {isSchemaLocked && <ProtectedSchemaWarning schema={selectedSchema} entity="triggers" />}

      <DataTableRenderer<PostgresTrigger>
        className="min-h-0 flex-1"
        columns={columns}
        rows={schemaTriggers}
        rowKey={(row) => String(row.id)}
        isLoading={isProjectPending || (shouldFetch && isTriggersPending)}
        error={isError ? (error as Error) : null}
        filters={filters}
        toolbarLeft={toolbarLeft}
        toolbarRight={toolbarRight}
        rowActions={rowActions}
        onRowDoubleClick={
          !isSchemaLocked && canWriteTriggers ? (row) => editTrigger(row) : undefined
        }
        emptyState={{
          title: isSchemaLocked ? 'No triggers' : 'Add your first trigger',
          description: isSchemaLocked
            ? `Triggers in schema "${selectedSchema}" cannot be managed here.`
            : 'Make your database reactive: realtime updates, edge functions, or validation as data changes.',
          action:
            !isSchemaLocked && hasTables && canWriteTriggers
              ? { label: 'New trigger', onClick: createTrigger }
              : undefined,
        }}
      />

      <TriggerSheet
        selectedTrigger={triggerToEdit || triggerToDuplicate}
        open={isCreating || !!triggerToEdit || !!triggerToDuplicate}
        onClose={closePanels}
        isDuplicatingTrigger={!!triggerToDuplicate}
      />

      <TextConfirmModal
        variant="warning"
        visible={!!triggerToDelete}
        onCancel={() => void setDeleteId(null)}
        onConfirm={onDeleteConfirm}
        title="Delete this trigger"
        loading={isDeletingTrigger}
        confirmLabel={`Delete trigger ${triggerToDelete?.name}`}
        confirmPlaceholder="Type in name of trigger"
        confirmString={triggerToDelete?.name ?? ''}
        text={
          <>
            This will delete your trigger called{' '}
            <span className="text-bold text-foreground">{triggerToDelete?.name}</span> of schema{' '}
            <span className="text-bold text-foreground">{triggerToDelete?.schema}</span>
          </>
        }
        alert={{
          title: 'You cannot recover this trigger once deleted.',
        }}
      />
    </div>
  )
}
