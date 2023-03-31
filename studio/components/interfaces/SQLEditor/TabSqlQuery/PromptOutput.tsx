import { useState, useEffect } from 'react'
import SimpleCodeBlock from 'components/to-be-cleaned/SimpleCodeBlock'
import { copyToClipboard } from 'lib/helpers'
import { Button, IconCheck, IconClipboard, IconSave } from 'ui'

interface PromptOutputProps {
  output: string
  onSaveOutput: (output: string) => void
}

const PromptOutput = ({ output, onSaveOutput }: PromptOutputProps) => {
  const [showCopied, setShowCopied] = useState(false)

  useEffect(() => {
    if (!showCopied) return
    const timer = setTimeout(() => setShowCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [showCopied])

  return (
    <div className="space-y-2 flex-grow">
      <div className="px-4 py-2 bg-scale-400 rounded-md border border-scale-600 w-full">
        <SimpleCodeBlock language="sql">{output}</SimpleCodeBlock>
      </div>
      <div className="flex items-center justify-end space-x-2">
        <Button
          type="default"
          icon={
            showCopied ? (
              <IconCheck size="tiny" className="text-brand-900" strokeWidth={2} />
            ) : (
              <IconClipboard size="tiny" />
            )
          }
          onClick={() => {
            setShowCopied(true)
            copyToClipboard(output)
          }}
        >
          {showCopied ? 'Copied' : 'Copy SQL'}
        </Button>
        <Button type="default" icon={<IconSave size="tiny" />} onClick={() => onSaveOutput(output)}>
          Save into new snippet
        </Button>
      </div>
    </div>
  )
}

export default PromptOutput
