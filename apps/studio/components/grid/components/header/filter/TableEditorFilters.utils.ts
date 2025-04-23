import { useCallback } from 'react'
import { executeSql } from 'data/sql/execute-sql-query'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'

/**
 * Hook for filter options in the table editor
 */
export const useFilterOptions = () => {
  const { project } = useProjectContext()

  /**
   * Check if a column is a foreign key
   */
  const isForeignKey = useCallback(
    (relationships: any[] | undefined, columnName: string): boolean => {
      if (!relationships || !Array.isArray(relationships)) return false
      const isFK = relationships.some((rel) => rel.source_column_name === columnName)
      return isFK
    },
    []
  )

  /**
   * Get the relationship object for a column if it's a foreign key
   */
  const getForeignKeyRelationship = useCallback(
    (relationships: any[] | undefined, columnName: string) => {
      if (!relationships || !Array.isArray(relationships)) return null
      const rel = relationships.find((rel) => rel.source_column_name === columnName) || null
      return rel
    },
    []
  )

  /**
   * Create a function that fetches options for any foreign key column
   * Returns an async function as required by FilterBar component
   */
  const createForeignKeyOptionsFunction = useCallback(
    (schema: string, relationships: any[] | undefined, columnName: string) => {
      // Return an async function that returns options in format expected by FilterBar
      return async (search?: string) => {
        console.log(`Fetching options for column '${columnName}'`, { search })

        if (!project?.ref) {
          console.error('Cannot fetch foreign key options: No project ref available')
          return []
        }

        try {
          // Get the relationship for this column
          const relationship = getForeignKeyRelationship(relationships, columnName)
          if (!relationship) {
            console.error(`No relationship metadata found for column '${columnName}'`)
            return []
          }

          const targetSchema = relationship.target_table_schema
          const targetTable = relationship.target_table_name
          const targetColumn = relationship.target_column_name

          console.log(
            `Foreign key relationship found: '${columnName}' → '${targetSchema}.${targetTable}.${targetColumn}'`
          )

          // Get all columns of the target table with their data types
          const columnsQuery = `
            SELECT column_name, data_type
            FROM information_schema.columns 
            WHERE table_schema = '${targetSchema}' 
            AND table_name = '${targetTable}'
            ORDER BY ordinal_position;
          `

          let availableColumns: string[] = []
          let descriptiveColumns: string[] = []
          let searchableColumns: string[] = []
          const descriptiveColumnPatterns = [
            'name',
            'title',
            'label',
            'description',
            'address',
            'surname',
            'firstname',
            'lastname',
            'first_name',
            'last_name',
            'email',
            'username',
            'display',
          ]

          // Exact column name matches to prioritize first
          const exactColumnMatches = ['email', 'name', 'title', 'username', 'display_name']

          let columnTypes: Record<string, string> = {}

          try {
            const columnsResponse = await executeSql({
              projectRef: project.ref,
              connectionString: project.connectionString,
              sql: columnsQuery,
            })

            if (columnsResponse && !('error' in columnsResponse)) {
              // Store column data types for debugging
              columnTypes =
                columnsResponse.result?.reduce((acc: Record<string, string>, row: any) => {
                  acc[row.column_name] = row.data_type
                  return acc
                }, {}) || {}

              availableColumns =
                columnsResponse.result
                  ?.map((row: any) => row.column_name)
                  .filter((col: string) => col !== targetColumn) || []

              // Find exact matches
              const exactMatches = availableColumns.filter((column) =>
                exactColumnMatches.some((match) => column.toLowerCase() === match.toLowerCase())
              )

              // Find partial matches
              const partialMatches = availableColumns.filter(
                (column) =>
                  !exactMatches.includes(column) && // Don't include columns already in exactMatches
                  descriptiveColumnPatterns.some((pattern) =>
                    column.toLowerCase().includes(pattern.toLowerCase())
                  )
              )

              // Define searchable columns - these are the columns we'll search against
              searchableColumns = [...exactMatches, ...partialMatches]

              // Define display columns - these are shown in the results
              // Prioritize exact matches, then partial matches
              if (exactMatches.length < 3) {
                descriptiveColumns = [
                  ...exactMatches,
                  ...partialMatches.slice(0, 3 - exactMatches.length),
                ]
              } else {
                descriptiveColumns = exactMatches.slice(0, 3)
              }

              console.log(
                `Available columns in ${targetTable}:`,
                availableColumns
                  .map((col) => `${col} (${columnTypes[col] || 'unknown type'})`)
                  .join(', ')
              )

              console.log(
                `Searchable columns:`,
                searchableColumns
                  .map((col) => `${col} (${columnTypes[col] || 'unknown type'})`)
                  .join(', ')
              )

              console.log(
                `Display columns:`,
                descriptiveColumns
                  .map((col) => `${col} (${columnTypes[col] || 'unknown type'})`)
                  .join(', ')
              )
            }
          } catch (error) {
            console.error('Error fetching table columns:', error)
          }

          // Prioritize descriptive columns for display, then fall back to first few columns
          const columnsToInclude =
            descriptiveColumns.length > 0
              ? descriptiveColumns.slice(0, 3)
              : availableColumns.slice(0, 3)

          console.log(
            `Columns to include in query:`,
            columnsToInclude
              .map((col) => `${col} (${columnTypes[col] || 'unknown type'})`)
              .join(', ')
          )

          // Build WHERE clause to search across multiple columns
          let whereClause = ''
          if (search && search.trim() !== '') {
            const searchColumns = [...searchableColumns]
            // Always include the target column in search
            if (!searchColumns.includes(targetColumn)) {
              searchColumns.unshift(targetColumn)
            }

            // Create a WHERE clause that searches across all searchable columns
            const searchConditions = searchColumns
              .map((col) => `${col}::text ILIKE '%${search}%'`)
              .join(' OR ')

            whereClause = `WHERE (${searchConditions})`
            console.log(`Search WHERE clause: ${whereClause}`)
          }

          // SQL query to get values from the target table matching any searchable column
          // Include prioritized columns in the results
          const sql =
            columnsToInclude.length > 0
              ? `
              SELECT DISTINCT
                ${targetColumn}::text as value,
                ${columnsToInclude.map((col) => `${col}::text as "${col}"`).join(', ')}
              FROM ${targetSchema}.${targetTable}
              ${whereClause}
              ORDER BY ${targetColumn}::text
              LIMIT 5
            `
              : `
              SELECT DISTINCT
                ${targetColumn}::text as value
              FROM ${targetSchema}.${targetTable}
              ${whereClause}
              ORDER BY ${targetColumn}::text
              LIMIT 5
            `

          console.log('Executing SQL query:', sql)

          const response = await executeSql({
            projectRef: project.ref,
            connectionString: project.connectionString,
            sql,
          })

          if (!response) {
            console.error('SQL query returned no response')
            return []
          }

          if ('error' in response) {
            console.error('SQL query error:', response.error)
            return []
          }

          // Log the raw results to help debug
          console.log('Raw results:', response.result)

          // Map to array of objects with value and label properties
          // Use the ID as the value (for filtering) and formatted string as the label (for display)
          const options =
            response.result?.map((row: any) => {
              // Generate a formatted label with additional info if available
              let label = row.value

              // Include prioritized descriptive columns in the display label
              const additionalInfo = columnsToInclude
                .map((col) => row[col])
                .filter((val) => val !== null && val !== undefined && val !== '')

              if (additionalInfo.length > 0) {
                // Format: additional info comma separated
                label = `${additionalInfo.join(', ')}`
              }

              // Return object with separate value and label
              return {
                value: row.value,
                label: label,
              }
            }) || []

          console.log(`Found ${options.length} options for '${columnName}'`, options)

          return options
        } catch (error) {
          console.error(`Error fetching options for '${columnName}':`, error)
          return []
        }
      }
    },
    [project, getForeignKeyRelationship]
  )

  return {
    isForeignKey,
    createForeignKeyOptionsFunction,
  }
}
