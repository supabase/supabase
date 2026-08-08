'use client'

import { Check, Copy } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button_Shadcn_ } from 'ui'

import { useSendTelemetryEvent } from '@/lib/telemetry'

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
    // Extracts title and framework e.g. "title: password-based-auth, framework: nextjs"
    const match = cmd.match(
      /(?:\/ui\/r\/|@supabase\/)(.+)-(nextjs|react-router|react|tanstack|vue|nuxtjs)(?:@[^@\s]+|\.json)?$/
    )

    const framework =
      (match?.[2] as 'nextjs' | 'react-router' | 'tanstack' | 'react' | 'vue' | 'nuxtjs') ?? 'react'
    const title = match?.[1] ?? ''

    // Extract package manager from command prefix (npx, pnpm, yarn, bun)
    const packageManager = cmd.startsWith('npx')
      ? ('npm' as const)
      : cmd.startsWith('pnpm')
        ? ('pnpm' as const)
        : cmd.startsWith('yarn')
          ? ('yarn' as const)
          : cmd.startsWith('bun')
            ? ('bun' as const)
            : ('npm' as const)

    return { framework, packageManager, title }
  }

  return (
    <Button_Shadcn_
      variant="ghost"
      size="icon"
      onClick={() => {
        // Copy command to clipboard
        navigator.clipboard.writeText(command)
        setCopied(true)

        // Parse command and send telemetry event
        const { framework, packageManager, title } = parseCommandForTelemetry(command)

        sendTelemetryEvent({
          action: 'supabase_ui_command_copy_button_clicked',
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
