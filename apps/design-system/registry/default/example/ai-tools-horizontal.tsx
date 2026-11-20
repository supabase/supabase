'use client'

import { AiTools } from 'ui-patterns/AiTools'

export default function AiToolsHorizontal() {
  return (
    <AiTools
      pageUrl="https://supabase.com/pricing"
      markdownUrl="/pricing.md"
      markdownFallback={() => '# Pricing'}
      orientation="horizontal"
      titleClassName="sr-only"
    />
  )
}
