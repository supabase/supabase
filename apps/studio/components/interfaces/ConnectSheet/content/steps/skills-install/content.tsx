import { Copy } from 'lucide-react'
import { useState } from 'react'
import { Button, copyToClipboard } from 'ui'

import type { StepContentProps } from '@/components/interfaces/ConnectSheet/Connect.types'

const DEFAULT_SKILLS_COMMAND = 'npx skills add supabase/agent-skills'
const SERVER_SKILLS_COMMAND = 'npx skills add supabase/server'

function SkillsInstallContent({ state }: StepContentProps) {
  const [copyLabel, setCopyLabel] = useState('Copy')

  const skillsCommand = state.mode === 'server' ? SERVER_SKILLS_COMMAND : DEFAULT_SKILLS_COMMAND

  const handleCopy = () => {
    copyToClipboard(skillsCommand, () => {
      setCopyLabel('Copied')
      setTimeout(() => setCopyLabel('Copy'), 2000)
    })
  }

  return (
    <div className="relative group">
      <div className="bg-surface-75 border rounded-lg p-3 pr-20 font-mono text-sm text-foreground-light overflow-x-auto">
        <code>{skillsCommand}</code>
      </div>
      <div className="absolute right-2 top-1/2 -translate-y-1/2">
        <Button
          variant="default"
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

export default SkillsInstallContent
