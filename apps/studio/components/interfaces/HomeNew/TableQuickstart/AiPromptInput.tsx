import { useState } from 'react'
import { AiIconAnimation, cn } from 'ui'
import { Sparkles } from 'lucide-react'

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
    <form onSubmit={handleSubmit} className="w-full">
      <div
        className={cn(
          'relative group bg-surface-100 rounded-lg border transition-all duration-200',
          isFocused ? 'border-foreground/30 shadow-lg' : 'border-default hover:border-foreground/20',
          isLoading && 'animate-pulse'
        )}
      >
        <div className="flex items-center px-4 py-3 gap-3">
          <div className="flex-shrink-0">
            {isLoading ? (
              <AiIconAnimation size={20} loading={true} className="text-brand" />
            ) : (
              <Sparkles size={20} className="text-foreground-light group-hover:text-brand transition-colors" />
            )}
          </div>

          <input
            type="text"
            placeholder="Describe the tables you want to create..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={isLoading}
            className="flex-1 bg-transparent border-0 outline-0 ring-0 placeholder:text-foreground-lighter text-foreground-default focus:outline-none"
          />

          <button
            type="submit"
            disabled={!prompt.trim() || isLoading}
            className={cn(
              'flex items-center gap-2 px-4 py-1.5 rounded-md font-medium text-xs transition-all',
              'bg-foreground text-background-default hover:bg-foreground/90',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-surface-100'
            )}
          >
            {isLoading ? 'Generating...' : 'Generate'}
          </button>
        </div>

        {!isLoading && (
          <div className="absolute -bottom-6 left-4 text-[11px] text-foreground-lighter">
            Try: "project management tool" or "e-commerce platform"
          </div>
        )}
      </div>
    </form>
  )
}
