import { Copy, ExternalLink } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button, copyToClipboard } from 'ui'

import type { ConnectState, ProjectKeys } from '../Connect.types'

interface ShadcnStepProps {
  state: ConnectState
  projectKeys: ProjectKeys
}

function getShadcnCommand(state: ConnectState): string | null {
  if (state.framework === 'nextjs') {
    return 'npx shadcn@latest add @supabase/supabase-client-nextjs'
  }

  if (state.framework === 'react') {
    return 'npx shadcn@latest add @supabase/supabase-client-react-router'
  }

  return null
}

export function ShadcnCommandStep({ state }: ShadcnStepProps) {
  const command = useMemo(() => getShadcnCommand(state), [state])
  const [copyLabel, setCopyLabel] = useState('Copy')

  if (!command) return null

  const handleCopy = () => {
    copyToClipboard(command, () => {
      setCopyLabel('Copied')
      setTimeout(() => setCopyLabel('Copy'), 2000)
    })
  }

  return (
    <div className="relative group">
      <div className="bg-surface-100 border rounded-lg p-3 pr-20 font-mono text-sm text-foreground-light overflow-x-auto">
        <code>{command}</code>
      </div>
      <div className="absolute right-2 top-1/2 -translate-y-1/2">
        <Button
          type="default"
          size="tiny"
          icon={<Copy size={14} />}
          onClick={handleCopy}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {copyLabel}
        </Button>
      </div>
    </div>
  )
}

export function ShadcnUiStep(_: ShadcnStepProps) {
  return (
    <Button asChild type="default" icon={<ExternalLink size={14} />}>
      <a href="https://supabase.com/ui" target="_blank" rel="noreferrer">
        Explore supabase.com/ui
      </a>
    </Button>
  )
}
