import { Save } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useSqlTitleGenerateMutation } from 'data/ai/sql-title-mutation'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useOrgAiOptInLevel } from 'hooks/misc/useOrgOptedIntoAi'
import { useProfile } from 'lib/profile'
import { createSqlSnippetSkeletonV2 } from 'components/interfaces/SQLEditor/SQLEditor.utils'
import { untitledSnippetTitle } from 'components/interfaces/SQLEditor/SQLEditor.constants'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import { useTabsStateSnapshot } from 'state/tabs'
import uuidv4 from 'lib/uuid'
import { Button, cn } from 'ui'

export const SaveButton = () => {
  const router = useRouter()
  const { ref } = useParams()
  const { profile } = useProfile()
  const { data: project } = useSelectedProjectQuery()
  const { isHipaaProjectDisallowed } = useOrgAiOptInLevel()

  const tabs = useTabsStateSnapshot()
  const snapV2 = useSqlEditorV2StateSnapshot()
  const { mutateAsync: generateSqlTitle } = useSqlTitleGenerateMutation()

  const [isSaving, setIsSaving] = useState(false)

  // Get the active tab - could be any tab with type 'sql'
  const activeTab = tabs.activeTab ? tabs.tabsMap[tabs.activeTab] : null

  if (!activeTab || activeTab.type !== 'sql') {
    return null
  }

  const activeTabId = activeTab.id

  // Get tab SQL and snippet ID
  const tabSql = activeTab.metadata?.sql ?? ''
  const snippetId = activeTab.metadata?.snippetId

  // Get snippet SQL if it exists
  const snippet = snippetId ? snapV2.snippets[snippetId]?.snippet : null
  const snippetSql = snippet?.content?.sql ?? ''

  // Show save button if:
  // 1. SQL is different from snippet SQL (for existing snippets)
  // 2. OR no snippet exists and SQL is not empty (for new tabs)
  const showSaveButton = snippetId ? tabSql !== snippetSql : tabSql.trim().length > 0

  const handleSave = async () => {
    if (!ref || !profile || !project) return

    try {
      setIsSaving(true)

      if (snippetId) {
        // Update existing snippet
        snapV2.setSql(snippetId, tabSql)
        snapV2.addNeedsSaving(snippetId)
        toast.success('Query saved successfully')
      } else {
        // Create new snippet
        const newSnippetId = uuidv4()

        // Generate AI title if not HIPAA project
        let snippetName = untitledSnippetTitle
        if (!isHipaaProjectDisallowed && tabSql.trim().length > 0) {
          try {
            const { title } = await generateSqlTitle({ sql: tabSql })
            snippetName = title
          } catch (error) {
            // Fallback to untitled if AI title generation fails
            console.error('Failed to generate AI title:', error)
          }
        }

        const newSnippet = createSqlSnippetSkeletonV2({
          id: newSnippetId,
          name: snippetName,
          sql: tabSql,
          owner_id: profile.id,
          project_id: project.id,
        })

        snapV2.addSnippet({ projectRef: ref, snippet: newSnippet })
        snapV2.addNeedsSaving(newSnippetId)

        // Close the old local tab
        tabs.removeTab(activeTabId)

        // Navigate to the new snippet (will create a new tab with snippet ID)
        router.push(`/project/${ref}/sql/${newSnippetId}`)

        toast.success('Query created successfully')
      }
    } catch (error: any) {
      toast.error(`Failed to save query: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Button
      type="default"
      size="tiny"
      icon={<Save size={14} />}
      loading={isSaving}
      onClick={handleSave}
      className={cn('opacity-0', showSaveButton && 'opacity-100')}
    >
      Save
    </Button>
  )
}
