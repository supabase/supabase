import { MessageSquare } from 'lucide-react'
import { useParams } from 'common'
import { AiIconAnimation, Button } from 'ui'
import { useProjectByRef } from 'hooks/misc/useSelectedProject'
import { useTablesQuery } from 'data/tables/tables-query'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { Branch } from 'data/branches/branches-query'

interface ReviewWithAIProps {
  currentBranch?: Branch
  mainBranch?: Branch
  parentProjectRef?: string
  diffContent?: string
  edgeFunctionsDiff?: {
    hasChanges: boolean
    addedSlugs: string[]
    removedSlugs: string[]
    modifiedSlugs: string[]
  }
  className?: string
  disabled?: boolean
}

export const ReviewWithAI = ({
  currentBranch,
  mainBranch,
  parentProjectRef,
  diffContent,
  edgeFunctionsDiff,
  className,
  disabled = false,
}: ReviewWithAIProps) => {
  const aiSnap = useAiAssistantStateSnapshot()

  // Get parent project for production schema
  const parentProject = useProjectByRef(parentProjectRef)

  // Fetch production schema tables
  const { data: productionTables } = useTablesQuery(
    {
      projectRef: parentProjectRef,
      connectionString: (parentProject as any)?.connectionString,
      schema: 'public',
      includeColumns: true,
    },
    { enabled: !!parentProjectRef && !!parentProject }
  )

  const tablesToSQL = (tables: typeof productionTables) => {
    if (!Array.isArray(tables)) return ''

    const warning =
      '-- PRODUCTION SCHEMA (for context only - not meant to be run)\n-- Table order and constraints may not be valid for execution.\n\n'

    const sql = tables
      .map((table) => {
        if (!table || !Array.isArray((table as any).columns)) return ''

        const columns = (table as { columns?: any[] }).columns ?? []
        const columnLines = columns.map((c) => {
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
          const pkCols = table.primary_keys.map((pk) => pk.name).join(', ')
          constraints.push(`  CONSTRAINT ${table.name}_pkey PRIMARY KEY (${pkCols})`)
        }

        if (Array.isArray(table.relationships)) {
          table.relationships.forEach((rel) => {
            if (rel && rel.source_table_name === table.name) {
              constraints.push(
                `  CONSTRAINT ${rel.constraint_name} FOREIGN KEY (${rel.source_column_name}) REFERENCES ${rel.target_table_schema}.${rel.target_table_name}(${rel.target_column_name})`
              )
            }
          })
        }

        const allLines = [...columnLines, ...constraints]
        return `CREATE TABLE ${table.schema}.${table.name} (\n${allLines.join(',\n')}\n);`
      })
      .join('\n\n')

    return warning + sql
  }

  const handleReviewWithAssistant = () => {
    if (!currentBranch || !mainBranch) return

    // Prepare diff content for the assistant
    const sqlSnippets = []

    // Add production schema SQL if available
    if (productionTables && productionTables.length > 0) {
      const productionSQL = tablesToSQL(productionTables)
      if (productionSQL.trim()) {
        sqlSnippets.push(productionSQL)
      }
    }

    // Add database diff content if available
    if (diffContent && diffContent.trim()) {
      sqlSnippets.push('-- DATABASE CHANGES:\n' + diffContent)
    }

    // Add edge functions diff if available
    if (edgeFunctionsDiff && edgeFunctionsDiff.hasChanges) {
      const functionDiffs = []

      // Add added functions
      if (edgeFunctionsDiff.addedSlugs.length > 0) {
        functionDiffs.push(`-- Added Edge Functions:\n${edgeFunctionsDiff.addedSlugs.join(', ')}`)
      }

      // Add removed functions
      if (edgeFunctionsDiff.removedSlugs.length > 0) {
        functionDiffs.push(
          `-- Removed Edge Functions:\n${edgeFunctionsDiff.removedSlugs.join(', ')}`
        )
      }

      // Add modified functions
      if (edgeFunctionsDiff.modifiedSlugs.length > 0) {
        functionDiffs.push(
          `-- Modified Edge Functions:\n${edgeFunctionsDiff.modifiedSlugs.join(', ')}`
        )
      }

      if (functionDiffs.length > 0) {
        sqlSnippets.push(functionDiffs.join('\n\n'))
      }
    }

    aiSnap.newChat({
      name: `Review merge: ${currentBranch.name} → ${mainBranch.name}`,
      open: true,
      sqlSnippets: sqlSnippets.length > 0 ? sqlSnippets : undefined,
      initialInput: `Please review this merge request from branch "${currentBranch.name}" into "${mainBranch.name || 'main'}". 

I've included the current production schema as context, along with the proposed changes.

Analyze the changes and provide feedback on:
- Database schema changes and potential impacts on the production schema
- Migration safety and rollback considerations
- Edge function modifications if any
- Overall code quality and best practices
- Potential breaking changes or compatibility issues
- Data integrity and constraint implications

Please be concise with your response.`,
      suggestions: {
        title: `I can help you review the merge from "${currentBranch.name}" to "${mainBranch.name}", here are some specific areas I can focus on:`,
        prompts: [
          {
            label: 'Schema Impact',
            description:
              'Analyze the database schema changes and their potential impact on production...',
          },
          {
            label: 'Migration Safety',
            description: 'Review the migration safety and rollback strategies...',
          },
          {
            label: 'Performance',
            description: 'Analyze potential performance implications of these changes...',
          },
          {
            label: 'Data Integrity',
            description: 'Review constraints, indexes, and data integrity implications...',
          },
        ],
      },
    })
  }

  return (
    <Button
      type="default"
      onClick={handleReviewWithAssistant}
      disabled={disabled || !currentBranch || !mainBranch}
      icon={<AiIconAnimation size={16} />}
      className={className}
    >
      Review with assistant
    </Button>
  )
}
