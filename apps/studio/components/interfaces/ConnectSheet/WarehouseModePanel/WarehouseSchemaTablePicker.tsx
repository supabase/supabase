import { useParams } from 'common'
import { ArrowLeft, ChevronDown, ChevronRight, Warehouse } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button, Checkbox } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import {
  buildSelectionFromPublicationTables,
  buildWarehouseSetupTargets,
  getSchemaCheckedState,
  getSchemaTableKey,
  getSelectedTableCount,
  isSelectableWarehouseSchema,
  type SchemaTableSelection,
  type SchemaWithTables,
} from './WarehouseModePanel.utils'
import { AlertError } from '@/components/ui/AlertError'
import { useSchemasQuery } from '@/data/database/schemas-query'
import { useReplicationPublicationsQuery } from '@/data/replication/publications-query'
import { useReplicationSourceId } from '@/data/replication/sources-query'
import { useTablesQuery } from '@/data/tables/tables-query'
import { useUpdateWarehouseCatalogMutation } from '@/data/warehouse/warehouse-catalog-mutation'
import { useWarehouseSetupMutation } from '@/data/warehouse/warehouse-setup-mutation'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { WAREHOUSE_PUBLICATION_NAME } from '@/lib/warehouse'

export interface WarehouseSchemaTablePickerProps {
  /**
   * Provided only when the picker was opened to edit an already-enabled Warehouse, which is what
   * gives it something to navigate back to (the connection details).
   */
  onBack?: () => void
}

export const WarehouseSchemaTablePicker = ({ onBack }: WarehouseSchemaTablePickerProps) => {
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const isEditing = onBack !== undefined

  // `null` until the user touches a checkbox, so the selection seeded from the existing
  // publication can arrive asynchronously without an effect syncing it into state.
  const [selectionOverride, setSelectionOverride] = useState<SchemaTableSelection | null>(null)
  const [expandedOverrides, setExpandedOverrides] = useState<Record<string, boolean>>({})

  const {
    data: schemas,
    isPending: isSchemasPending,
    isError: isSchemasError,
    error: schemasError,
  } = useSchemasQuery({ projectRef, connectionString: project?.connectionString })

  const {
    data: tables,
    isPending: isTablesPending,
    isError: isTablesError,
    error: tablesError,
  } = useTablesQuery({ projectRef, connectionString: project?.connectionString })

  // The `supabase_warehouse` publication is the source of truth for what's currently replicated.
  const sourceId = useReplicationSourceId({ projectRef })
  const {
    data: publications,
    isLoading: isPublicationsLoading,
    isError: isPublicationsError,
    error: publicationsError,
  } = useReplicationPublicationsQuery({ projectRef, sourceId })

  const initialSelection = useMemo(() => {
    const warehousePublication = publications?.find(
      (publication) => publication.name === WAREHOUSE_PUBLICATION_NAME
    )
    return buildSelectionFromPublicationTables(warehousePublication?.tables ?? [])
  }, [publications])

  const selection = selectionOverride ?? initialSelection

  const schemasWithTables: SchemaWithTables[] = useMemo(() => {
    if (!schemas || !tables) return []
    return schemas
      .filter((schema) => isSelectableWarehouseSchema(schema.name))
      .map((schema) => ({
        schema: schema.name,
        tables: tables.filter((table) => table.schema === schema.name).map((table) => table.name),
      }))
      .sort((a, b) => a.schema.localeCompare(b.schema))
  }, [schemas, tables])

  const setupMutation = useWarehouseSetupMutation()
  // Declared as a hook option rather than passed to `mutate()`: this component unmounts as soon as
  // setup starts (the panel switches to the progress view), and per-call callbacks are dropped on
  // unmount, which would swallow the failure entirely.
  const catalogMutation = useUpdateWarehouseCatalogMutation({
    onError: (error) => {
      toast.error(
        `Warehouse was enabled, but DuckLake catalog access could not be enabled automatically: ${error.message}. You can retry this from the connection details.`
      )
    },
  })

  const selectedCount = getSelectedTableCount(selection)

  const updateSelection = (updater: (current: SchemaTableSelection) => SchemaTableSelection) => {
    setSelectionOverride((prev) => updater(prev ?? initialSelection))
  }

  const toggleTable = (schema: string, table: string) => {
    const key = getSchemaTableKey(schema, table)
    updateSelection((current) => ({ ...current, [key]: !current[key] }))
  }

  const toggleSchema = (schema: SchemaWithTables) => {
    const allSelected =
      schema.tables.length > 0 &&
      schema.tables.every((table) => selection[getSchemaTableKey(schema.schema, table)])

    updateSelection((current) => {
      const next = { ...current }
      schema.tables.forEach((table) => {
        next[getSchemaTableKey(schema.schema, table)] = !allSelected
      })
      return next
    })
  }

  const toggleExpanded = (schemaName: string, currentlyOpen: boolean) => {
    setExpandedOverrides((prev) => ({ ...prev, [schemaName]: !currentlyOpen }))
  }

  const handleEnableWarehouse = () => {
    if (!projectRef) return

    const targets = buildWarehouseSetupTargets(selection, schemasWithTables)
    if (targets.length === 0) return

    setupMutation.mutate(
      { projectRef, body: { targets } },
      {
        onSuccess: () => {
          // Fire-and-forget: setup itself should proceed even if enabling catalog access fails.
          // The connection details panel offers a manual "Enable catalog access" fallback.
          catalogMutation.mutate({ projectRef, body: { enabled: true } })
        },
      }
    )
  }

  // Waiting on publications too, so the pre-checked selection is in place before the user can
  // start toggling (an early toggle would otherwise pin an override that omits existing tables).
  if (isSchemasPending || isTablesPending || isPublicationsLoading) return <GenericSkeletonLoader />
  if (isSchemasError) return <AlertError subject="Failed to load schemas" error={schemasError} />
  if (isTablesError) return <AlertError subject="Failed to load tables" error={tablesError} />
  // Only blocking when editing: a first-time setup starts from an empty selection anyway, so a
  // failed publication lookup shouldn't stop the user from enabling Warehouse at all.
  if (isEditing && isPublicationsError) {
    return <AlertError subject="Failed to load replicated tables" error={publicationsError} />
  }

  return (
    <div>
      <div className="flex gap-3 mb-5">
        <div className="w-8 h-8 rounded-md bg-brand-200 flex items-center justify-center shrink-0">
          <Warehouse size={16} strokeWidth={1.5} className="text-brand" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            {isEditing ? 'Edit replicated tables' : 'Enable Warehouse'}
          </p>
          <p className="text-sm text-foreground-light mt-1 max-w-xl">
            {isEditing
              ? 'Choose which schemas or tables to replicate to your Warehouse. Tables already replicating are selected.'
              : 'Replicate your database to a low-latency analytical endpoint over FlightSQL. Choose which schemas or tables to replicate — you can change this later.'}
          </p>
        </div>
      </div>

      <p className="text-sm font-medium text-foreground-light mb-2">
        Schemas and tables to replicate
      </p>

      <div className="border rounded-md overflow-hidden divide-y">
        {schemasWithTables.map((schema) => {
          const keys = schema.tables.map((table) => getSchemaTableKey(schema.schema, table))
          const checkedCount = keys.filter((key) => selection[key]).length
          const checkedState = getSchemaCheckedState({
            selectedCount: checkedCount,
            totalCount: keys.length,
          })
          const isOpen = expandedOverrides[schema.schema] ?? checkedCount > 0

          return (
            <div key={schema.schema}>
              <div className="flex items-center gap-2 px-3 py-2 bg-surface-75">
                <button
                  type="button"
                  aria-label={isOpen ? `Collapse ${schema.schema}` : `Expand ${schema.schema}`}
                  onClick={() => toggleExpanded(schema.schema, isOpen)}
                  className="text-foreground-lighter"
                >
                  {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                <Checkbox
                  checked={checkedState}
                  onCheckedChange={() => toggleSchema(schema)}
                  disabled={schema.tables.length === 0}
                  aria-label={`Select all tables in ${schema.schema}`}
                  // The shared Checkbox only fills itself for `data-state=checked`, so a partial
                  // selection would otherwise render identically to an empty one. A muted fill
                  // keeps all three states visually distinct.
                  className="data-[state=indeterminate]:border-foreground-lighter data-[state=indeterminate]:bg-foreground-lighter"
                />
                <span className="text-sm font-mono text-foreground">{schema.schema}</span>
                <span className="text-xs text-foreground-lighter ml-auto">
                  {checkedCount}/{keys.length} tables
                </span>
              </div>
              {isOpen && (
                <div>
                  {schema.tables.map((table) => {
                    const key = getSchemaTableKey(schema.schema, table)
                    return (
                      <div key={key} className="flex items-center gap-2 pl-10 pr-3 py-2">
                        <Checkbox
                          checked={!!selection[key]}
                          onCheckedChange={() => toggleTable(schema.schema, table)}
                          aria-label={`Select ${schema.schema}.${table}`}
                        />
                        <span className="text-sm font-mono text-foreground-light">{table}</span>
                      </div>
                    )
                  })}
                  {schema.tables.length === 0 && (
                    <p className="pl-10 pr-3 py-2 text-sm text-foreground-lighter">
                      No tables in this schema.
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-foreground-lighter">
          {selectedCount} table{selectedCount === 1 ? '' : 's'} selected
        </span>
        <div className="flex items-center gap-2">
          {isEditing && (
            <Button variant="default" icon={<ArrowLeft size={14} />} onClick={onBack}>
              Back
            </Button>
          )}
          <Button
            variant="primary"
            disabled={selectedCount === 0}
            loading={setupMutation.isPending}
            onClick={handleEnableWarehouse}
          >
            {isEditing ? 'Update replicated tables' : 'Enable Warehouse'}
          </Button>
        </div>
      </div>
    </div>
  )
}
