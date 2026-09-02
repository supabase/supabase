'use client'

import { Check, Copy } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button_Shadcn_ } from 'ui'

import {
  buildBlockInstallPrompt,
  getInstallCommands,
  getMarkdownPageUrl,
  type ShadcnFramework,
} from '@/lib/install-command'

export function BlockInstallPromptButton({
  name,
  framework,
}: {
  name: string
  framework: ShadcnFramework
}) {
  const pathname = usePathname()
  const [copied, setCopied] = useState(false)
  const installCommand = getInstallCommands(name, { framework }).npm
  const prompt = buildBlockInstallPrompt({
    pageUrl: getMarkdownPageUrl(pathname),
    name,
    installCommand,
  })

  useEffect(() => {
    if (!copied) return

    const timeout = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timeout)
  }, [copied])

  return (
    <Button_Shadcn_
      variant="default"
      size="sm"
      className="h-7 gap-1 rounded-lg px-3 text-xs shadow-none"
      onClick={() => {
        navigator.clipboard.writeText(prompt)
        setCopied(true)
      }}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied prompt' : 'Copy prompt'}
      <span className="sr-only" role="status">
        {copied ? 'Agent install prompt copied' : ''}
      </span>
    </Button_Shadcn_>
  )
}
