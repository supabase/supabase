'use client'

import { AiIconAnimation, Button, cn } from 'ui'

import { useDocsAiSidebarOptional } from './DocsAiSidebarContext'

function GuideMobileAiButton({ className }: { className?: string }) {
  const sidebar = useDocsAiSidebarOptional()

  if (!sidebar) return null

  return (
    <Button
      type="default"
      size="small"
      icon={<AiIconAnimation size={16} allowHoverEffect />}
      onClick={() => sidebar.open()}
      className={cn('mb-4 lg:hidden', className)}
    >
      Ask Supabase AI
    </Button>
  )
}

export { GuideMobileAiButton }
