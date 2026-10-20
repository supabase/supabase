'use client'

import { AiTools } from 'ui-patterns/AiTools'

export default function AiToolsMinimal() {
  return (
    <AiTools
      pageUrl="https://supabase.com/docs/guides/getting-started"
      markdownUrl="/docs/guides/getting-started.md"
      markdownFallback={() => '# Getting started'}
    />
  )
}
