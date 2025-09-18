import { useState } from 'react'
import { AiIconAnimation, cn } from 'ui'

interface AiPromptInputProps {
  onGenerate: (prompt: string) => void
  isLoading?: boolean
}

export const AiPromptInput = ({ onGenerate, isLoading = false }: AiPromptInputProps) => {
  const [prompt, setPrompt] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (prompt.trim() && !isLoading) {
      onGenerate(prompt.trim())
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div
        className={cn(
          'relative group bg-surface-100 rounded-lg border transition-all duration-200',
          isFocused ? 'border-foreground/30 shadow-lg' : 'border-default hover:border-foreground/20',
          isLoading && 'opacity-80'
        )}
      >
        <div className="flex items-center px-4 py-3 gap-3">
          <div className="flex-shrink-0">
            <AiIconAnimation size={20} loading={isLoading} className="text-brand" />
          </div>

          <input
            type="text"
            placeholder="What kind of app are you building?"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={isLoading}
            className="flex-1 bg-transparent border-0 outline-0 ring-0 placeholder:text-foreground-lighter text-foreground-default focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
          />

          <button
            type="submit"
            disabled={!prompt.trim() || isLoading}
            className={cn(
              'flex items-center gap-2 px-4 py-1.5 rounded-md font-medium text-xs transition-all',
              'bg-brand text-white hover:bg-brand-600',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-surface-100'
            )}
          >
            {isLoading ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>
    </form>
  )
}
