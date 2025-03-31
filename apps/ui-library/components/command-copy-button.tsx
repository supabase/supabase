'use client'

import { Check, Copy } from 'lucide-react'
import { useEffect, useState } from 'react'

import { useSendTelemetryEvent } from 'lib/telemetry'
import { Button_Shadcn_ } from 'ui'

export function CommandCopyButton({ command }: { command: string }) {
  const [copied, setCopied] = useState(false)
  const sendTelemetryEvent = useSendTelemetryEvent()

  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => setCopied(false), 2000)
      return () => clearTimeout(timeout)
    }
  }, [copied])

  const parseCommandForTelemetry = (cmd: string) => {
    // Extract framework from URL
    const frameworkMatch = cmd.match(/\/ui\/r\/.*?-(\w+)\.json/)
    const framework = frameworkMatch
      ? (frameworkMatch[1] as 'nextjs' | 'react-router' | 'tanstack' | 'react')
      : 'nextjs'

    // Extract package manager from command
    const packageManager = cmd.startsWith('npx')
      ? ('npm' as const)
      : cmd.startsWith('pnpm')
        ? ('pnpm' as const)
        : cmd.startsWith('yarn')
          ? ('yarn' as const)
          : cmd.startsWith('bun')
            ? ('bun' as const)
            : ('npm' as const)

    // Extract title from URL
    const titleMatch = cmd.match(/\/ui\/r\/(.*?)-\w+\.json/)
    const title = titleMatch ? titleMatch[1] : ''

    return {
      framework,
      packageManager,
      title,
    }
  }

  return (
    <Button_Shadcn_
      variant="ghost"
      size="icon"
      onClick={() => {
        navigator.clipboard.writeText(command)
        setCopied(true)
        const { framework, packageManager, title } = parseCommandForTelemetry(command)
        console.log('Command parsed:', { command, framework, packageManager, title })
        sendTelemetryEvent({
          action: 'supabase_ui_command_copied',
          properties: {
            templateTitle: title,
            command: command,
            framework,
            packageManager,
          },
        })
      }}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </Button_Shadcn_>
  )
}
