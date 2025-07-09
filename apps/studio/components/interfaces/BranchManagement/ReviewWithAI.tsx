import { AiIconAnimation } from 'ui'
import { useProjectByRef } from 'hooks/misc/useSelectedProject'
import { useTablesQuery } from 'data/tables/tables-query'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { Branch } from 'data/branches/branches-query'
import { tablesToSQL } from 'lib/helpers'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'

interface ReviewWithAIProps {
  currentBranch?: Branch
  mainBranch?: Branch
  parentProjectRef?: string
  diffContent?: string
  disabled?: boolean
}

export const ReviewWithAI = ({
  currentBranch,
  mainBranch,
  parentProjectRef,
  diffContent,
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

  const handleReviewWithAssistant = () => {
    if (!currentBranch || !mainBranch) return

    // Prepare diff content for the assistant
    const sqlSnippets = []

    // Add production schema SQL if available
    if (productionTables && productionTables.length > 0) {
      const productionSQL = tablesToSQL(productionTables)
      if (productionSQL.trim()) {
        sqlSnippets.push({
          label: 'Production Schema',
          content: productionSQL,
        })
      }
    }

    // Add database diff content if available
    if (diffContent && diffContent.trim()) {
      sqlSnippets.push({
        label: 'Database Changes',
        content: '-- DATABASE CHANGES:\n' + diffContent,
      })
    }

    aiSnap.newChat({
      name: `Review merge: ${currentBranch.name} → ${mainBranch.name}`,
      open: true,
      sqlSnippets: sqlSnippets.length > 0 ? sqlSnippets : undefined,
      initialInput: `Please review this merge request from branch "${currentBranch.name}" into "${mainBranch.name || 'main'}". 

I've included the current production schema as context, along with the proposed database changes.

Analyze the changes and provide feedback on:
- Database schema changes and potential impacts on the production schema
- Migration safety and rollback considerations
- Overall code quality and best practices
- Potential breaking changes or compatibility issues
- Data integrity and constraint implications

Please be concise with your response.`,
      suggestions: {
        title: `I can help you review the database schema changes from "${currentBranch.name}" to "${mainBranch.name}", here are some specific areas I can focus on:`,
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
    <ButtonTooltip
      type="default"
      disabled={disabled || !currentBranch || !mainBranch}
      className="px-1"
      onClick={handleReviewWithAssistant}
      tooltip={{
        content: {
          side: 'bottom',
          text: 'Ask Supabase Assistant to review the merge request',
        },
      }}
    >
      <AiIconAnimation size={16} />
      <span className="sr-only">Review with Assistant</span>
    </ButtonTooltip>
  )
}
