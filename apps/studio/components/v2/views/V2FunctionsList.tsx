'use client'

import { useDatabaseFunctionsQuery } from 'data/database-functions/database-functions-query'
import type { DatabaseFunction } from 'data/database-functions/database-functions-query'
import { useSchemasQuery } from 'data/database/schemas-query'
import { isValidConnString } from 'data/fetchers'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'
import { CopyPlus, Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import {
  Button,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'

import { useV2Params } from '@/app/v2/V2ParamsContext'
import { CreateFunction } from '@/components/interfaces/Database/Functions/CreateFunction'
import { DataTableRenderer } from '@/components/v2/DataTableRenderer'
import type { DataTableColumn } from '@/components/v2/DataTableRenderer'
import { useEntityPanelParams } from '@/components/v2/hooks/useEntityPanelParams'

const FUNCTIONS_COLUMNS: DataTableColumn<DatabaseFunction>[] = [
  {
    id: 'name',
    name: 'Name',
    width: 220,
    minWidth: 140,
    renderCell: (_v, row) => <span className="font-mono text-xs text-foreground">{row.name}</span>,
  },
  {
    id: 'schema',
    name: 'Schema',
    width: 140,
    type: 'text',
    renderCell: (_v, row) => <span className="text-foreground-lighter">{row.schema}</span>,
  },
  {
    id: 'language',
    name: 'Language',
    width: 120,
    type: 'badge',
    badgeMap: {
      plpgsql: { label: 'plpgsql', variant: 'default' },
      sql: { label: 'sql', variant: 'default' },
      c: { label: 'C', variant: 'secondary' },
      internal: { label: 'internal', variant: 'default' },
    },
  },
  {
    id: 'return_type',
    name: 'Returns',
    width: 150,
    renderCell: (_v, row) => (
      <span className="font-mono text-xs text-foreground-light">
        {row.return_type}
        {row.is_set_returning_function ? ' (set)' : ''}
      </span>
    ),
  },
  {
    id: 'argument_types',
    name: 'Arguments',
    width: 200,
    renderCell: (_v, row) => (
      <span className="font-mono text-xs text-foreground-lighter truncate">
        {row.argument_types || '—'}
      </span>
    ),
  },
  {
    id: 'security_definer',
    name: 'Security definer',
    width: 140,
    type: 'boolean',
  },
]

export function V2FunctionsList() {
  const { projectRef } = useV2Params()
  const [schema, setSchema] = useState('public')
  const {
    isCreating,
    setIsCreating,
    editingId,
    setEditingId,
    duplicatingId,
    setDuplicatingId,
    closePanels,
  } = useEntityPanelParams()

  const { data: project, isPending: isProjectPending } = useProjectDetailQuery(
    { ref: projectRef },
    { enabled: Boolean(projectRef) }
  )

  const shouldFetch = Boolean(projectRef) && isValidConnString(project?.connectionString)

  const { data: schemas } = useSchemasQuery(
    { projectRef, connectionString: project?.connectionString },
    { enabled: shouldFetch }
  )

  const {
    data: functions,
    isPending: isFunctionsPending,
    isError,
    error,
  } = useDatabaseFunctionsQuery(
    { projectRef, connectionString: project?.connectionString },
    { enabled: shouldFetch }
  )

  const schemaFunctions = (functions ?? []).filter(
    (f) => schema === '__all__' || f.schema === schema
  )
  const functionToEdit = schemaFunctions.find((f) => f.id.toString() === editingId)
  const functionToDuplicate = schemaFunctions.find((f) => f.id.toString() === duplicatingId)

  const schemaSelector = (
    <Select_Shadcn_ value={schema} onValueChange={setSchema}>
      <SelectTrigger_Shadcn_ className="h-8 w-[140px] text-xs">
        <SelectValue_Shadcn_ />
      </SelectTrigger_Shadcn_>
      <SelectContent_Shadcn_>
        <SelectItem_Shadcn_ value="__all__">All schemas</SelectItem_Shadcn_>
        {schemas?.map((s) => (
          <SelectItem_Shadcn_ key={s.name} value={s.name}>
            {s.name}
          </SelectItem_Shadcn_>
        ))}
      </SelectContent_Shadcn_>
    </Select_Shadcn_>
  )

  return (
    <>
      <DataTableRenderer<DatabaseFunction>
        columns={FUNCTIONS_COLUMNS}
        rows={schemaFunctions}
        rowKey="id"
        isLoading={isProjectPending || (shouldFetch && isFunctionsPending)}
        error={isError ? (error as Error) : null}
        filters={[
          {
            id: 'search',
            label: 'Search',
            type: 'search',
            placeholder: 'Filter functions…',
          },
        ]}
        toolbarLeft={schemaSelector}
        toolbarRight={
          <Button
            type="primary"
            size="tiny"
            icon={<Plus size={12} />}
            onClick={() => setIsCreating(true)}
          >
            Create function
          </Button>
        }
        rowActions={[
          {
            id: 'edit',
            label: 'Edit function',
            icon: <Pencil size={12} />,
            onClick: (row) => {
              setDuplicatingId(null)
              setEditingId(row.id.toString())
            },
          },
          {
            id: 'duplicate',
            label: 'Duplicate function',
            icon: <CopyPlus size={12} />,
            onClick: (row) => {
              setEditingId(null)
              setDuplicatingId(row.id.toString())
            },
          },
        ]}
        emptyState={{
          title: 'No functions found',
          description: 'Create a database function to get started.',
        }}
      />

      <CreateFunction
        func={functionToEdit || functionToDuplicate}
        visible={isCreating || !!functionToEdit || !!functionToDuplicate}
        isDuplicating={!!functionToDuplicate}
        onClose={closePanels}
      />
    </>
  )
}
