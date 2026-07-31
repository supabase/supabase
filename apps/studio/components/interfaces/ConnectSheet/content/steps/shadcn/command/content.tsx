import { useMemo } from 'react'
import { CodeBlock } from 'ui-patterns/CodeBlock'

import type { StepContentProps } from '@/components/interfaces/ConnectSheet/Connect.types'
import { InlineLink } from '@/components/ui/InlineLink'

function getShadcnCommand(state: StepContentProps['state']): string | null {
  if (state.framework === 'nextjs') {
    return 'npx shadcn@latest add @supabase/supabase-client-nextjs'
  }

  if (state.framework === 'react') {
    return 'npx shadcn@latest add @supabase/supabase-client-react-router'
  }

  return null
}

function ShadcnCommandContent({ state }: StepContentProps) {
  const command = useMemo(() => getShadcnCommand(state), [state])

  if (!command) return null

  return (
    <div className="flex flex-col gap-2">
      <CodeBlock
        className="[&_code]:text-foreground"
        wrapperClassName="lg:col-span-2"
        value={command}
        hideLineNumbers
        language="bash"
      >
        {command}
      </CodeBlock>
      <p className="text-sm text-foreground-lighter">
        Add UI components for auth, realtime, storage, and more at{' '}
        <InlineLink href="https://supabase.com/ui">supabase.com/ui</InlineLink>.
      </p>
    </div>
  )
}

export default ShadcnCommandContent
