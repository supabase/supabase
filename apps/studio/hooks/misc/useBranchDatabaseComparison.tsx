import { useMemo } from 'react'
import { useTablesQuery } from 'data/tables/tables-query'
import { useTableDefinitionQuery } from 'data/database/table-definition-query'
import { isEqual } from 'lodash'

interface BranchDatabaseComparisonProps {
  mainBranchProjectRef?: string
  currentBranchProjectRef?: string
  mainBranchConnectionString?: string | null
  currentBranchConnectionString?: string | null
}

export interface TableComparison {
  tableName: string
  schemaName: string
  mainTableId?: number
  currentTableId?: number
  status: 'added' | 'removed' | 'modified' | 'unchanged'
  mainDefinition?: string
  currentDefinition?: string
  mainTable?: any // Add full table object from main branch
  currentTable?: any // Add full table object from current branch
}

export interface DatabaseComparison {
  isLoading: boolean
  isError: boolean
  tables: TableComparison[]
  addedTables: TableComparison[]
  removedTables: TableComparison[]
  modifiedTables: TableComparison[]
  unchangedTables: TableComparison[]
  totalChanges: number
}

export function useBranchDatabaseComparison({
  mainBranchProjectRef,
  currentBranchProjectRef,
  mainBranchConnectionString,
  currentBranchConnectionString,
}: BranchDatabaseComparisonProps): DatabaseComparison {
  // Debug logging
  console.log('🔍 Branch Database Comparison Debug:', {
    mainBranchProjectRef,
    currentBranchProjectRef,
    mainBranchConnectionString: mainBranchConnectionString
      ? '[REDACTED]'
      : mainBranchConnectionString,
    currentBranchConnectionString: currentBranchConnectionString
      ? '[REDACTED]'
      : currentBranchConnectionString,
  })

  // Fetch tables from both branches
  const {
    data: mainTables,
    isLoading: mainTablesLoading,
    isError: mainTablesError,
    error: mainTablesErrorDetails,
  } = useTablesQuery(
    {
      projectRef: mainBranchProjectRef,
      connectionString: mainBranchConnectionString,
      includeColumns: true,
    },
    {
      enabled: !!mainBranchProjectRef,
    }
  )

  const {
    data: currentTables,
    isLoading: currentTablesLoading,
    isError: currentTablesError,
    error: currentTablesErrorDetails,
  } = useTablesQuery(
    {
      projectRef: currentBranchProjectRef,
      connectionString: currentBranchConnectionString,
      includeColumns: true,
    },
    {
      enabled: !!currentBranchProjectRef,
    }
  )

  // Debug logging for fetched data
  console.log('📊 Tables Data:', {
    mainBranchProjectRef,
    currentBranchProjectRef,
    mainTables: mainTables?.map((t) => ({ id: t.id, name: t.name, schema: t.schema })),
    currentTables: currentTables?.map((t) => ({ id: t.id, name: t.name, schema: t.schema })),
    mainTablesLoading,
    currentTablesLoading,
    mainTablesError,
    currentTablesError,
    mainTablesErrorDetails,
    currentTablesErrorDetails,
  })

  // Compare and categorize tables
  const comparison = useMemo((): DatabaseComparison => {
    const isLoading = mainTablesLoading || currentTablesLoading

    const isError = mainTablesError || currentTablesError

    console.log('🔄 Comparison Status:', {
      isLoading,
      isError,
      hasMainTables: !!mainTables,
      hasCurrentTables: !!currentTables,
      mainTablesCount: mainTables?.length || 0,
      currentTablesCount: currentTables?.length || 0,
    })

    if (isLoading || isError || !mainTables || !currentTables) {
      return {
        isLoading,
        isError,
        tables: [],
        addedTables: [],
        removedTables: [],
        modifiedTables: [],
        unchangedTables: [],
        totalChanges: 0,
      }
    }

    const tableComparisons: TableComparison[] = []

    // Check each table from main branch
    mainTables.forEach((mainTable) => {
      const currentTable = currentTables.find(
        (t) => t.name === mainTable.name && t.schema === mainTable.schema
      )

      console.log(`🔍 Checking main table ${mainTable.schema}.${mainTable.name}:`, {
        foundInCurrent: !!currentTable,
        mainTableId: mainTable.id,
        currentTableId: currentTable?.id,
      })

      if (!currentTable) {
        // Table was removed
        tableComparisons.push({
          tableName: mainTable.name,
          schemaName: mainTable.schema,
          mainTableId: mainTable.id,
          currentTableId: undefined,
          status: 'removed',
          mainDefinition: undefined, // Will be populated by parent component
          currentDefinition: undefined,
          mainTable: mainTable,
          currentTable: undefined,
        })
        console.log(`❌ Table ${mainTable.schema}.${mainTable.name} was REMOVED`)
      } else {
        // Table exists in both - check if they are actually different by comparing SQL
        const mainSQL = tableToSQL(mainTable)
        const currentSQL = tableToSQL(currentTable)
        const isModified = mainSQL !== currentSQL

        tableComparisons.push({
          tableName: mainTable.name,
          schemaName: mainTable.schema,
          mainTableId: mainTable.id,
          currentTableId: currentTable.id,
          status: isModified ? 'modified' : 'unchanged',
          mainDefinition: undefined, // Will be populated by parent component
          currentDefinition: undefined, // Will be populated by parent component
          mainTable: mainTable,
          currentTable: currentTable,
        })
        console.log(
          `${isModified ? '🔄' : '✅'} Table ${mainTable.schema}.${mainTable.name} ${isModified ? 'was MODIFIED' : 'is UNCHANGED'}`
        )
      }
    })

    // Check for added tables (exist in current but not main)
    currentTables.forEach((currentTable) => {
      const mainTable = mainTables.find(
        (t) => t.name === currentTable.name && t.schema === currentTable.schema
      )

      if (!mainTable) {
        tableComparisons.push({
          tableName: currentTable.name,
          schemaName: currentTable.schema,
          mainTableId: undefined,
          currentTableId: currentTable.id,
          status: 'added',
          mainDefinition: undefined,
          currentDefinition: undefined, // Will be populated by parent component
          mainTable: undefined,
          currentTable: currentTable,
        })
        console.log(`➕ Table ${currentTable.schema}.${currentTable.name} was ADDED`)
      }
    })

    // Categorize tables (note: modified status will be determined after definitions are fetched)
    const addedTables = tableComparisons.filter((t) => t.status === 'added')
    const removedTables = tableComparisons.filter((t) => t.status === 'removed')
    const modifiedTables = tableComparisons.filter((t) => t.status === 'modified')
    const unchangedTables = tableComparisons.filter((t) => t.status === 'unchanged')

    const totalChanges = addedTables.length + removedTables.length + modifiedTables.length

    console.log('📈 Final Comparison Results:', {
      totalTables: tableComparisons.length,
      addedCount: addedTables.length,
      removedCount: removedTables.length,
      modifiedCount: modifiedTables.length,
      unchangedCount: unchangedTables.length,
      totalChanges,
      tableComparisons: tableComparisons.map((t) => ({
        name: `${t.schemaName}.${t.tableName}`,
        status: t.status,
        mainId: t.mainTableId,
        currentId: t.currentTableId,
      })),
    })

    return {
      isLoading: false,
      isError: false,
      tables: tableComparisons,
      addedTables,
      removedTables,
      modifiedTables,
      unchangedTables,
      totalChanges,
    }
  }, [
    mainTables,
    currentTables,
    mainTablesLoading,
    currentTablesLoading,
    mainTablesError,
    currentTablesError,
  ])

  return comparison
}

// Hook specifically for fetching table definitions for comparison
export function useTableDefinitionComparison(
  mainProjectRef?: string,
  currentProjectRef?: string,
  mainConnectionString?: string | null,
  currentConnectionString?: string | null,
  mainTableId?: number,
  currentTableId?: number
) {
  console.log('🔧 Table Definition Comparison:', {
    mainProjectRef,
    currentProjectRef,
    mainTableId,
    currentTableId,
  })

  const mainDefinition = useTableDefinitionQuery(
    {
      projectRef: mainProjectRef,
      connectionString: mainConnectionString,
      id: mainTableId,
    },
    {
      enabled: !!mainProjectRef && !!mainTableId,
    }
  )

  const currentDefinition = useTableDefinitionQuery(
    {
      projectRef: currentProjectRef,
      connectionString: currentConnectionString,
      id: currentTableId,
    },
    {
      enabled: !!currentProjectRef && !!currentTableId,
    }
  )

  const isModified =
    mainDefinition.data !== currentDefinition.data &&
    mainDefinition.data !== undefined &&
    currentDefinition.data !== undefined

  console.log('📝 Definition Comparison Result:', {
    mainTableId,
    currentTableId,
    hasMainDefinition: !!mainDefinition.data,
    hasCurrentDefinition: !!currentDefinition.data,
    isModified,
    mainLoading: mainDefinition.isLoading,
    currentLoading: currentDefinition.isLoading,
  })

  return {
    mainDefinition: mainDefinition.data,
    currentDefinition: currentDefinition.data,
    isLoading: mainDefinition.isLoading || currentDefinition.isLoading,
    isError: mainDefinition.isError || currentDefinition.isError,
    isModified,
  }
}

// Helper function to convert table data to SQL for comparison
function tableToSQL(table: any): string {
  if (!table || !Array.isArray(table.columns)) {
    return '-- Table definition not available'
  }

  const columns = table.columns || []
  const columnLines = columns.map((c: any) => {
    let line = `  ${c.name} ${c.data_type}`
    if (c.is_identity) {
      line += ' GENERATED ALWAYS AS IDENTITY'
    }
    if (c.is_nullable === false) {
      line += ' NOT NULL'
    }
    if (c.default_value !== null && c.default_value !== undefined) {
      line += ` DEFAULT ${c.default_value}`
    }
    if (c.is_unique) {
      line += ' UNIQUE'
    }
    if (c.check) {
      line += ` CHECK (${c.check})`
    }
    return line
  })

  const constraints: string[] = []

  if (Array.isArray(table.primary_keys) && table.primary_keys.length > 0) {
    const pkCols = table.primary_keys.map((pk: any) => pk.name).join(', ')
    constraints.push(`  CONSTRAINT ${table.name}_pkey PRIMARY KEY (${pkCols})`)
  }

  if (Array.isArray(table.relationships)) {
    table.relationships.forEach((rel: any) => {
      if (rel && rel.source_table_name === table.name) {
        constraints.push(
          `  CONSTRAINT ${rel.constraint_name} FOREIGN KEY (${rel.source_column_name}) REFERENCES ${rel.target_table_schema}.${rel.target_table_name}(${rel.target_column_name})`
        )
      }
    })
  }

  const allLines = [...columnLines, ...constraints]
  return `CREATE TABLE ${table.schema}.${table.name} (\n${allLines.join(',\n')}\n);`
}
