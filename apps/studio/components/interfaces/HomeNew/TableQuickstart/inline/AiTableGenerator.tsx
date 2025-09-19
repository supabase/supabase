import { useState, FormEvent } from 'react'
import { motion } from 'framer-motion'
import { AiIconAnimation, cn } from 'ui'
import { itemVariants } from './animations'

interface AiTableGeneratorProps {
  onGenerate: (prompt: string) => void
  isLoading: boolean
}

export function AiTableGenerator({ onGenerate, isLoading }: AiTableGeneratorProps) {
  const [prompt, setPrompt] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (prompt.trim() && !isLoading) {
      onGenerate(prompt.trim())
    }
  }

  const quickIdeas = [
    'Social media platform',
    'E-commerce marketplace',
    'Project management tool',
    'Content management system',
  ]

  return (
    <motion.div variants={itemVariants} className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-foreground">What kind of app are you building?</h3>
        <p className="text-sm text-foreground-light">
          Describe your idea and we'll generate the perfect database tables for you.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full">
        <div
          className={cn(
            'relative group bg-surface-100 rounded-lg border transition-all duration-200',
            isFocused
              ? 'border-foreground-muted shadow-lg'
              : 'border-default hover:border-foreground-muted',
            isLoading && 'opacity-80'
          )}
        >
          <div className="flex items-center px-4 py-3 gap-3">
            <div className="flex-shrink-0">
              <AiIconAnimation size={20} loading={isLoading} className="text-brand" />
            </div>

            <input
              type="text"
              placeholder="Describe your application..."
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

      {!isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-default"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-foreground-lighter">Quick ideas</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {quickIdeas.map((idea) => (
              <button
                key={idea}
                onClick={() => {
                  setPrompt(idea)
                  onGenerate(idea)
                }}
                disabled={isLoading}
                className={cn(
                  'px-3 py-1.5 text-xs rounded-md border transition-all',
                  'bg-surface-100 border-default hover:border-foreground-muted',
                  'hover:bg-surface-200 disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {idea}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}