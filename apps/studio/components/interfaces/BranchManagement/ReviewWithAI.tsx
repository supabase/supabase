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
          content: 'CURRENT PRODUCTION SCHEMA:\n' + productionSQL,
        })
      }
    }

    // Add database diff content if available
    if (diffContent && diffContent.trim()) {
      sqlSnippets.push({
        label: 'Database Changes',
        content: '-- DATABASE CHANGES TO BE MERGED IN:\n' + diffContent,
      })
    }

    aiSnap.newChat({
      name: `Review merge: ${currentBranch.name} → ${mainBranch.name}`,
      open: true,
      sqlSnippets: sqlSnippets.length > 0 ? sqlSnippets : undefined,
      initialInput: `I want to run the attached database changes on my production database branch as part of a branch merge from "${currentBranch.name}" into "${mainBranch.name || 'main'}". I've included the current production database schema as extra context. Please analyze the proposed schema changes and provide concise feedback on their impact on the production schema including any migration concerns and potential conflicts.`,
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
