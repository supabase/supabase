import { useState, useEffect } from 'react'
import CopyToClipboard from 'react-copy-to-clipboard'
import { Button, IconCheck, IconClipboard, IconSave } from 'ui'
import { useCommandMenu } from '../CommandMenuProvider'
import { stripIndent } from 'common-tags'
import { formatTitle } from './GenerateSQL.utils'
import { Message, MessageRole, MessageStatus, queryAi } from './../AiCommand'

export interface SQLOutputActionsProps {
  answer: string
  messages: Message[]
}

const SQLOutputActions = ({ answer, messages }: SQLOutputActionsProps) => {
  const [showCopied, setShowCopied] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  const { project, saveGeneratedSQL } = useCommandMenu()

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
    await saveGeneratedSQL?.(answer, formattedTitle)
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
    <div className="flex items-center justify-end space-x-2">
      <CopyToClipboard text={answer?.replace(/```.*/g, '').trim()}>
        <Button
          type="default"
          icon={
            showCopied ? (
              <IconCheck size="tiny" className="text-brand" strokeWidth={2} />
            ) : (
              <IconClipboard size="tiny" />
            )
          }
          onClick={() => setShowCopied(true)}
        >
          {showCopied ? 'Copied' : 'Copy SQL'}
        </Button>
      </CopyToClipboard>
      {project?.ref !== undefined && saveGeneratedSQL !== undefined && (
        <Button
          type="default"
          loading={isSaving}
          disabled={isSaving}
          icon={
            isSaved ? (
              <IconCheck size="tiny" className="text-brand" strokeWidth={2} />
            ) : (
              <IconSave size="tiny" />
            )
          }
          onClick={() => onSelectSaveSnippet()}
        >
          {isSaved ? 'Snippet saved!' : 'Save into new snippet'}
        </Button>
      )}
    </div>
  )
}

export default SQLOutputActions
