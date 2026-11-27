import { Check, Copy, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Button, copyToClipboard } from 'ui'

import type { Example } from '@/data/types'
import { buildStartPrompt } from '@/lib/start-prompt'

/** The prompt a coding agent needs to set this template up as your own app, shown in full. */
export function PromptPanel({ example }: { example: Example }) {
  const [isCopied, setIsCopied] = useState(false)
  const prompt = buildStartPrompt(example)

  const handleCopy = () => {
    copyToClipboard(prompt, () => {
      setIsCopied(true)
      window.setTimeout(() => setIsCopied(false), 2000)
    })
  }

  return (
    <section
      aria-labelledby="prompt-heading"
      className="flex flex-col gap-3 rounded-lg border bg-surface-100 p-4"
    >
      <div className="flex flex-col gap-1">
        <h2 id="prompt-heading" className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="size-4 text-brand" />
          Build it with your coding agent
        </h2>
        <p className="text-sm text-foreground-light">
          Paste this prompt into your agent. It creates a Supabase project from the template’s
          migrations and deploys it to Vercel.
        </p>
      </div>

      <pre
        tabIndex={0}
        aria-label="Prompt"
        className="max-h-48 overflow-auto whitespace-pre-wrap wrap-anywhere rounded-md border bg-background p-3 font-mono text-xs leading-relaxed text-foreground-light"
      >
        {prompt}
      </pre>

      <Button
        block
        size="medium"
        variant="primary"
        icon={isCopied ? <Check /> : <Copy />}
        onClick={handleCopy}
      >
        {isCopied ? 'Copied' : 'Copy prompt'}
      </Button>
    </section>
  )
}
