'use client'

import { Check, Copy } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from 'ui'

interface CopyDocPromptProps {
  title: string
  markdownPath: string
  intent: 'create-app' | 'add-to-project'
}

export function CopyDocPrompt({ title, markdownPath, intent }: CopyDocPromptProps) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle')

  useEffect(() => {
    if (status !== 'copied') return
    const timeout = window.setTimeout(() => setStatus('idle'), 2500)
    return () => window.clearTimeout(timeout)
  }, [status])

  async function copyPrompt() {
    const url = new URL(markdownPath, window.location.origin).href
    const task =
      intent === 'create-app'
        ? `Help me create a new application using ${title} from the Supabase UI Library. Inspect my workspace and create the app in a suitable directory.`
        : `Help me add ${title} from the Supabase UI Library to my existing project. Inspect my project structure and reuse any Supabase client setup that is already in place.`
    const prompt = `${task} Read ${url} for the complete guide before making changes. Follow its prerequisites, installation, and configuration steps, adapting them to my project. Verify that the setup works.`

    try {
      await navigator.clipboard.writeText(prompt)
      setStatus('copied')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="flex max-w-full flex-col items-center">
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
        {status === 'copied' ? 'Prompt copied' : 'Copy agent prompt'}
      </Button>
      <span
        role="status"
        className={status === 'error' ? 'max-w-sm text-xs text-foreground-light' : 'sr-only'}
      >
        {status === 'error'
          ? 'Unable to copy the prompt. Try again.'
          : status === 'copied'
            ? 'Prompt copied to clipboard'
            : ''}
      </span>
    </div>
  )
}
