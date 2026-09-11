'use client'

import { Check, Copy } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from 'ui'

interface CopyDocPromptProps {
  title: string
  pagePath: string
  command: string
}

export function CopyDocPrompt({ title, pagePath, command }: CopyDocPromptProps) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle')

  useEffect(() => {
    if (status === 'idle') return
    const timeout = window.setTimeout(() => setStatus('idle'), 2500)
    return () => window.clearTimeout(timeout)
  }, [status])

  async function copyPrompt() {
    const url = new URL(pagePath, window.location.origin).href
    const prompt = `Help me install ${title} from the Supabase UI Library in my project. Read ${url} for the full setup instructions. Run these commands from my project directory:\n\n${command}\n\nCheck my existing project structure and reuse any Supabase client setup that is already in place.`

    try {
      await navigator.clipboard.writeText(prompt)
      setStatus('copied')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        variant="secondary"
        size="medium"
        className="rounded-full border-0 px-4"
        icon={
          status === 'copied' ? (
            <Check size={16} strokeWidth={2} />
          ) : (
            <Copy size={16} strokeWidth={2} />
          )
        }
        onClick={copyPrompt}
      >
        {status === 'copied' ? 'Prompt copied' : 'Copy prompt'}
      </Button>
      <span
        role="status"
        className={status === 'error' ? 'text-xs text-foreground-light' : 'sr-only'}
      >
        {status === 'error'
          ? 'Unable to copy. Open the Markdown link to view the instructions.'
          : status === 'copied'
            ? 'Prompt copied to clipboard'
            : ''}
      </span>
    </div>
  )
}
