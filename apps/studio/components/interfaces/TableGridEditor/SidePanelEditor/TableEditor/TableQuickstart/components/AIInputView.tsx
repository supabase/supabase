import { memo } from 'react'
import { Button, Input_Shadcn_ as Input } from 'ui'
import { BackButton } from './SharedComponents'

interface AIInputViewProps {
  prompt: string
  error: string | null
  isGenerating: boolean
  isLoading: boolean
  inputRef: React.RefObject<HTMLInputElement>
  onBack: () => void
  onPromptChange: (value: string) => void
  onGenerate: () => void
}

export const AIInputView = memo(
  ({
    prompt,
    error,
    isGenerating,
    isLoading,
    inputRef,
    onBack,
    onPromptChange,
    onGenerate,
  }: AIInputViewProps) => (
    <div className="space-y-2">
      <div className="flex gap-2">
        <BackButton onClick={onBack} disabled={isGenerating} />
      </div>
      {error && (
        <div className="text-sm text-red-600" role="alert">
          {error}
        </div>
      )}
      <div className="relative">
        <Input
          ref={inputRef}
          placeholder="Describe your table (e.g., 'user profiles with social features')"
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              onGenerate()
            }
          }}
          disabled={isGenerating || isLoading}
          aria-label="Table description for AI generation"
          aria-describedby="ai-prompt-help"
          className="pr-24"
        />
        <Button
          type="default"
          size="tiny"
          disabled={!prompt.trim() || isGenerating || isLoading}
          onClick={onGenerate}
          loading={isGenerating || isLoading}
          className="absolute right-1 top-1/2 -translate-y-1/2"
          aria-label={isGenerating ? 'Generating tables' : 'Generate tables'}
        >
          {isGenerating || isLoading ? 'Generating...' : 'Generate'}
        </Button>
      </div>
      <span id="ai-prompt-help" className="sr-only">
        Enter a description of your tables and press Enter or click Generate
      </span>
    </div>
  )
)

AIInputView.displayName = 'AIInputView'
