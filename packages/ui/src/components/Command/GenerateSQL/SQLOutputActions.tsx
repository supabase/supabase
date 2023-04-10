import { useState, useEffect } from 'react'
import CopyToClipboard from 'react-copy-to-clipboard'
import { Button, IconCheck, IconClipboard, IconSave } from 'ui'
import { useCommandMenu } from '../CommandMenuProvider'

const SQLOutputActions = ({ answer }: { answer: string }) => {
  const [showCopied, setShowCopied] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  const { project, onSaveGeneratedSQL } = useCommandMenu()

  const applyCallback = () =>
    onSaveGeneratedSQL !== undefined
      ? new Promise((resolve) => onSaveGeneratedSQL(answer, resolve))
      : {}

  const onSelectSaveSnippet = async () => {
    setIsSaving(true)
    await applyCallback()
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
              <IconCheck size="tiny" className="text-brand-900" strokeWidth={2} />
            ) : (
              <IconClipboard size="tiny" />
            )
          }
          onClick={() => setShowCopied(true)}
        >
          {showCopied ? 'Copied' : 'Copy SQL'}
        </Button>
      </CopyToClipboard>
      {project?.ref !== undefined && onSaveGeneratedSQL !== undefined && (
        <Button
          type="default"
          loading={isSaving}
          disabled={isSaving}
          icon={
            isSaved ? (
              <IconCheck size="tiny" className="text-brand-900" strokeWidth={2} />
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
