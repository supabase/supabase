'use client'

import { AiTools } from 'ui-patterns/AiTools'

export default function AiToolsDemo() {
  return (
    <AiTools
      pageUrl="https://supabase.com/docs/guides/getting-started"
      markdownUrl="/docs/guides/getting-started.md"
      markdownFallback={() => '# Getting started'}
      agentSetupHref="https://supabase.com/docs/guides/ai-tools"
      preferredSourceHref="https://www.google.com/preferences/source?q=supabase.com"
    />
  )
}
