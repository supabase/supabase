import { useMemo, useState, useRef, useEffect } from 'react'
import type { Filter, FilterOperator } from '@supabase/pg-meta/src/query'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'
import {
  FilterBar,
  FilterGroup,
  FilterProperty,
  FilterCondition as UIFilterCondition,
} from 'ui-patterns/FilterBar'
import { useTableFilter } from '../../hooks/useTableFilter'
import { FilterOperatorOptions } from './filter/Filter.constants'
import { useFilterOptions } from './filter/TableEditorFilters.utils'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useTablesQuery } from 'data/tables/tables-query'

export const TableEditorFilters = () => {
  const { filters, onApplyFilters } = useTableFilter()
  const snap = useTableEditorTableStateSnapshot()
  const { project } = useProjectContext()
  const filterBarRef = useRef<HTMLDivElement>(null)
  const { isForeignKey, createForeignKeyOptionsFunction } = useFilterOptions()

  // Fetch tables data to ensure we have relationships loaded
  // This will provide a fallback if the relationships aren't loaded in the table state
  const { data: tablesData } = useTablesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: snap.table?.schema || undefined,
    includeColumns: true,
  })

  // Find the current table in the tables data to get relationships if needed
  const tableWithRelationships = useMemo(() => {
    if (!tablesData || !snap.table?.id) return null
    return tablesData.find((t) => t.id === snap.table?.id)
  }, [tablesData, snap.table?.id])

  // Convert hook filters to FilterGroup format
  const initialFilters: FilterGroup = useMemo(() => {
    return {
      logicalOperator: 'AND' as const,
      conditions: filters.map((filter) => ({
        propertyName: filter.column,
        operator: filter.operator,
        value: filter.value,
      })),
    }
  }, [filters])

  // Initialize with filters from the hook
  const [internalFilters, setInternalFilters] = useState<FilterGroup>(initialFilters)
  const [freeformText, setFreeformText] = useState('')

  // Debugging the relationships
  useEffect(() => {
    // Log detailed table information to debug relationships
    console.log('TABLE STATE DETAILS:')
    console.log('- Table name:', snap.table?.name)
    console.log('- Schema:', snap.table?.schema)
    console.log('- Columns:', snap.table?.columns?.length)

    // Check if we have relationships either from the state or the tables query
    const relationships =
      (snap.table as any)?.relationships || (tableWithRelationships as any)?.relationships

    console.log('- Relationships:', relationships)

    // If we have relationships, log their structure
    if (relationships && Array.isArray(relationships)) {
      console.log('RELATIONSHIP DETAILS:')
      relationships.forEach((rel: any, i: number) => {
        console.log(`Relationship ${i}:`, {
          source: rel.source_column_name,
          target: `${rel.target_table_schema}.${rel.target_table_name}.${rel.target_column_name}`,
        })
      })
    } else {
      console.log('NO RELATIONSHIPS FOUND. Check if table metadata includes relationship info.')
    }
  }, [snap.table, tableWithRelationships])

  const filterProperties = useMemo(() => {
    const properties: FilterProperty[] = []

    // Get column info directly from snap
    if (snap.table?.columns && Array.isArray(snap.table.columns)) {
      // Access relationships safely - prefer the snap data, but fall back to tables query data
      const relationships =
        (snap.table as any)?.relationships || (tableWithRelationships as any)?.relationships
      const schema = snap.table.schema || 'public'

      console.log('Building filter properties with:', {
        columnCount: snap.table.columns.length,
        hasRelationships: !!relationships && Array.isArray(relationships),
        relationshipCount: relationships?.length,
        schema,
      })

      snap.table.columns.forEach((column: { name: string; format?: string }) => {
        if (column.name) {
          // Determine type based on column format
          let type: 'string' | 'number' | 'date' | 'boolean' = 'string'
          if (column.format?.includes('int') || column.format?.includes('numeric')) {
            type = 'number'
          } else if (column.format?.includes('time') || column.format?.includes('date')) {
            type = 'date'
          }

          // Check if this column is a foreign key
          const isFK = isForeignKey(relationships, column.name)

          // For any foreign key column, use the dynamic foreign key options function
          const options = isFK
            ? createForeignKeyOptionsFunction(schema, relationships, column.name)
            : []

          console.log(`Column '${column.name}':`, {
            isFK,
            format: column.format,
            type,
            hasOptionsFunction: isFK && typeof options === 'function',
          })

          properties.push({
            label: column.name,
            name: column.name,
            type,
            operators: FilterOperatorOptions.map((op) => op.value),
            options,
          })
        }
      })
    }

    return properties
  }, [
    snap.table?.columns,
    snap.table?.schema,
    tableWithRelationships,
    isForeignKey,
    createForeignKeyOptionsFunction,
  ])

  const handleFilterChange = (filterGroup: FilterGroup) => {
    // Update internal state
    setInternalFilters(filterGroup)

    // Convert to Filter[] format - extract only the valid conditions
    const newFilters: Filter[] = []

    filterGroup.conditions.forEach((condition) => {
      if (!('propertyName' in condition)) return
      if (!condition.propertyName) return

      newFilters.push({
        column: condition.propertyName,
        operator: condition.operator as FilterOperator,
        value: condition.value ?? '',
      })
    })

    // Apply the filters - let the hook handle duplicates
    onApplyFilters(newFilters)
  }

  return (
    <div ref={filterBarRef} className="w-full">
      <FilterBar
        filterProperties={filterProperties}
        filters={internalFilters}
        onFilterChange={handleFilterChange}
        freeformText={freeformText}
        onFreeformTextChange={setFreeformText}
      />
    </div>
  )
}
