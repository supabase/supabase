import { PermissionAction } from '@supabase/shared-types/out/constants'
import { codeBlock, stripIndent } from 'common-tags'
import { Check, Clipboard, Save } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import CopyToClipboard from 'react-copy-to-clipboard'
import { toast } from 'sonner'

import { useParams } from 'common'
import { createSqlSnippetSkeletonV2 } from 'components/interfaces/SQLEditor/SQLEditor.utils'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { uuidv4 } from 'lib/helpers'
import { useProfile } from 'lib/profile'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import { Button, cn } from 'ui'
import type { Message } from 'ui-patterns/CommandMenu/prepackaged/ai'
import { MessageRole, MessageStatus, queryAi } from 'ui-patterns/CommandMenu/prepackaged/ai'
import { formatTitle } from './SqlGenerator.utils'

const useSaveGeneratedSql = () => {
  const { ref } = useParams()
  const { profile } = useProfile()
  const selectedProject = useSelectedProject()
  const snapV2 = useSqlEditorV2StateSnapshot()
  const canCreateSQLSnippet = useCheckPermissions(PermissionAction.CREATE, 'user_content', {
    resource: { type: 'sql', owner_id: profile?.id },
    subject: { id: profile?.id },
  })

  const saveGeneratedSql = useCallback(
    (answer: string, title: string) => {
      if (!ref) return console.error('Project ref is required')
      if (!profile) return console.error('Profile is required')
      if (!selectedProject) return console.error('Project is required')

      if (!canCreateSQLSnippet) {
        toast('Unable to save query as you do not have sufficient permissions for this project')
        return
      }

      // Remove markdown syntax from returned answer
      answer = answer.replace(/`/g, '').replace(/sql\n/g, '').trim()

      const formattedSql = codeBlock`
    -- Note: This query was generated via Supabase AI, please verify the correctness of the
    -- SQL snippet before running it against your database as we are not able to guarantee it
    -- will do exactly what you requested the AI.
    ${answer}
  `

      try {
        const snippet = createSqlSnippetSkeletonV2({
          id: uuidv4(),
          name: title || 'Generated query',
          sql: formattedSql,
          owner_id: profile.id,
          project_id: selectedProject.id,
        })
        snapV2.addSnippet({ projectRef: ref, snippet })
        toast.success(`Successfully saved snippet!`)
      } catch (error: any) {
        toast.error(`Failed to create new query: ${error.message}`)
      }
    },
    [canCreateSQLSnippet, profile?.id, ref, selectedProject?.id, snapV2]
  )

  return saveGeneratedSql
}

export interface SQLOutputActionsProps {
  answer: string
  messages: Message[]
  className?: string
}

export function SQLOutputActions({ answer, messages, className }: SQLOutputActionsProps) {
  const { ref } = useParams()
  const saveGeneratedSql = useSaveGeneratedSql()

  const [showCopied, setShowCopied] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  const onSelectSaveSnippet = async () => {
    setIsSaving(true)

    let suggestedTitle
    try {
      suggestedTitle = await queryAi(
        [
          ...messages,
          {
            role: MessageRole.User,
            content: stripIndent`
            Generate a title for the above SQL snippet following all of these rules:
            - The title is only for the last SQL snippet
            - Focus on the main purposes of this snippet
            - Use as few words as possible
            - Title should be nouns, not verbs
            - Do not include word articles (eg. a, the, for, of)
            - Do not use words like "SQL" or "snippet" or "title"
            - Do not output markdown, quotes, etc
            - Do not be too verbose
            `,
            status: MessageStatus.Complete,
          },
        ],
        10000
      )
    } catch (error) {
      suggestedTitle = ''
    }

    const formattedTitle = formatTitle(suggestedTitle)
    await saveGeneratedSql(answer, formattedTitle)
    setIsSaved(true)
    setIsSaving(false)
  }

  useEffect(() => {
    if (!showCopied) return
    const timer = setTimeout(() => setShowCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [showCopied])

  useEffect(() => {
    if (!isSaved) return
    const timer = setTimeout(() => setIsSaved(false), 2000)
    return () => clearTimeout(timer)
  }, [isSaved])

  return (
    <div className={cn('flex items-center justify-end space-x-2', className)}>
      <CopyToClipboard text={answer?.replace(/```.*/g, '').trim()}>
        <Button
          type="default"
          icon={showCopied ? <Check className="text-brand" strokeWidth={2} /> : <Clipboard />}
          onClick={() => setShowCopied(true)}
        >
          {showCopied ? 'Copied' : 'Copy SQL'}
        </Button>
      </CopyToClipboard>
      {ref !== undefined && (
        <Button
          type="default"
          loading={isSaving}
          disabled={isSaving}
          icon={isSaved ? <Check className="text-brand" strokeWidth={2} /> : <Save />}
          onClick={() => onSelectSaveSnippet()}
        >
          {isSaved ? 'Snippet saved!' : 'Save into new snippet'}
        </Button>
      )}
    </div>
  )
}
