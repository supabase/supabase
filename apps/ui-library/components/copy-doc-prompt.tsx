'use client'

import { Check, Copy } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from 'ui'

interface CopyDocPromptProps {
  title: string
  markdownPath: string
}

export function CopyDocPrompt({ title, markdownPath }: CopyDocPromptProps) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle')

  useEffect(() => {
    if (status === 'idle') return
    const timeout = window.setTimeout(() => setStatus('idle'), 2500)
    return () => window.clearTimeout(timeout)
  }, [status])

  async function copyPrompt() {
    const url = new URL(markdownPath, window.location.origin).href
    const prompt = `Help me add ${title} from the Supabase UI Library to my project. Read the documentation at ${url} and follow its installation and setup instructions. Check my existing project structure and reuse any Supabase client setup that is already in place.`

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
        icon={status === 'copied' ? <Check size={14} /> : <Copy size={14} />}
        onClick={copyPrompt}
      >
        {status === 'copied' ? 'Prompt copied' : 'Copy agent prompt'}
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
